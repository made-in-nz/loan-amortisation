import React, { Component } from 'react';
import moment from 'moment';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Big from 'big.js';
import { saveState, loadState } from './App';

const frequency = {
  52: 7,
  26: 14 
}

export const storageKey = 'la-sched';

class LoanAmortisation extends Component {
	
  constructor(props) {
    super(props);
    this.state = { 
      amount: '',
      rate: '',
      term: '',
      repayment: '',
      startdate: moment().format('YYYY-MM-DD'),
      compounds: 'month',
      repaydate: moment().add(1, 'months').date(1).format('YYYY-MM-DD'),
      repayfreq: '',
      display: 'daily',
      summary: {},
      schedule: undefined
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
    this.generate = this.generate.bind(this);
  }

  componentDidMount() {
    const persistedState = loadState(storageKey);
		/*
		 * handle page refreshes without losing state.
		 */
    if (persistedState !== undefined) {
      this.setState(persistedState);
    }
  }

  handleChange(event) {
    const {name, id, value} = event.target;
    name ? this.setState({[name] : value}) : this.setState({[id] : value});
  }

  handleTermChange(event) {
    if ( event.target.value === '360' ) {
      this.setState({'display': 'monthly'});
    }
    this.handleChange(event);
  }

  repaymentDates() {
    const { term, startdate, repaydate, repayfreq } = this.state;
    let r = [];

    if (! this.shouldGenerateSchedule()) {
      return r;
    }

    let end = moment(startdate).add(term, 'months');
    // r.push(moment(repaydate));
    r.push(new Date(repaydate));

    let start = moment(repaydate);

    if (parseInt(this.state.repayfreq) === 12) {
      start.add(1, 'months');

      while (start.isSameOrBefore(end)) {
        r.push(new Date(start.format('YYYY-MM-DD')));
        // r.push(moment(start));
        start.add(1, 'months');
      }
    }
    else {
      start.add(frequency[parseInt(repayfreq)], 'days');

      while (start.isSameOrBefore(end)) {
        r.push(new Date(start.format('YYYY-MM-DD')));
        // r.push(moment(start));
        start.add(frequency[parseInt(repayfreq)], 'days');
      }
    }

    return r;
  }

  isCompoundingDate(current, repaymentdates) {
    if (this.state.compounds === 'month') {
      return current.date() === 1;
    }
    return this.isRepaymentDate(new Date(current.format('YYYY-MM-DD')), repaymentdates);
  }

  isRepaymentDate(current, repaymentdates) {
    // const f = repaymentdates.find((d) => current.isSame(d, 'day')) 
    const f = repaymentdates.find((d) => {
      return current.getTime() === d.getTime();
    }); 
    return f !== undefined;
  }

  /* Basic validation for form.
   * Every form field should be filled.
   */
  shouldGenerateSchedule() {
    if (Object.values(this.state).every((a) => a !== '')) {
      let ldate = moment(this.state.startdate);

      // Prevent schedules for crazy length periods
      if (ldate.isBefore(moment('2019-01-01'))) {
        this.setState({incomplete: true});
        return false;
      }
      this.setState({incomplete: false});
      return true;
    }
    this.setState({incomplete: true});
    return false;
  }

  dailyInterest(balance) {
    let brate = Big(this.state.rate);
    brate = brate.div(100);
    let annual = balance.times(brate);
    return annual.div(365);
    // return balance.times(Big(this.state.rate).div(100)).div(365);
  }

  getYear(m, s, y) { return m.isSameOrAfter(moment(s).add(y, 'years'), 'day') ? y+1 : y }; 

  generate() {
    const { amount, 
            display, 
            startdate, 
            repayment,
            term } = this.state; 

    saveState(storageKey, this.state);
    if (! this.shouldGenerateSchedule()) {
      this.setState({schedule: undefined});
      return;
    }

    let bamount = Big(amount);
    let daily = this.dailyInterest(bamount);
    let enddate = moment(startdate).add(term, 'months').subtract('1', 'days');

    // Current accrued interest.
    let accrued = Big(0);
    // Previous period accrued interest.
    let paccrued = Big(0);

    // Previious period principle paid.
    let pprinciple;

    /* Generate data for the schedule and summary.
    */
    let tsched = [];
    let summary = {samount: bamount.toFixed(2),
                   interest: Big(0),
                   repayment: Big(0),
                   year: []
                  };

    let year = 1;
    let ysum = { 'year': year, interest: 0};
    let repaymentdates = this.repaymentDates()

    for (var m = moment(startdate); m.isSameOrBefore(enddate); m.add(1, 'days')) {
      let repaymentdate = this.isRepaymentDate( new Date(m.format('YYYY-MM-DD')), repaymentdates );
      let compoundingdate = this.isCompoundingDate( m, repaymentdates );
      let nyear = this.getYear(m, startdate, year);
      if (nyear > year) {
        summary.year.push(ysum);
        year = nyear;
        ysum = { 'year': year, interest: 0};
      }

      if (repaymentdate) {
        /* On a repayment date, reduce loan balance and calculate new
         * daily interest.
         */
        bamount = bamount.minus(repayment);
        daily = this.dailyInterest(bamount);
        summary.repayment = summary.repayment.add(repayment);
      } 
      if (compoundingdate) {
        /* On interest compounding date, increase loan balance, calculate new
         * daily interest, and reset accrued interest.
         */
        bamount = bamount.plus(accrued);
        paccrued = accrued;
        accrued = Big(0);
        daily = this.dailyInterest(bamount);
      } 
      /* Last transaction of each day is to accrue the interest for the day.
      */
      accrued = accrued.add(daily);
      summary.interest = summary.interest.add(daily);
      ysum.interest = Big(ysum.interest).add(daily).toFixed(2);

      pprinciple = this.state.compounds === 'repayment' ? 
        Big(this.state.repayment).minus(paccrued).toFixed(2) :
        undefined;

      /* Update the schedule data depending on the display type selected.
       */
      if ((display === 'monthly' &&
          compoundingdate ) ||
          display === 'daily') {
        tsched.push({date: m.format('DD/MM/YYYY'),
                      balance: bamount.toFixed(2),
                      accrued: accrued.toFixed(2),
                      paccrued: paccrued.toFixed(2),
                      principle: pprinciple,
                      daily: daily.toFixed(2),
                      repayment: repaymentdate,
                      compounding: compoundingdate }
                      );
      }
    }
    /* Apply any accrued interest to get the final loan balance.
    */
    bamount = bamount.plus(accrued);
    tsched.push({date: 'Final Balance',
                  balance: bamount.toFixed(2),
                  accrued: '',
                  daily: ''}
                  );

    summary.principle = summary.repayment.minus(summary.interest).toFixed(2);
    summary.interest = summary.interest.toFixed(2);
    summary.repayment = summary.repayment.toFixed(2);
    summary.sdate = moment(startdate).format('DD/MM/YYYY');
    summary.edate = moment(enddate).format('DD/MM/YYYY');
    summary.amount = Big(amount).toFixed(2);
    summary.display = display;
    summary.year.push(ysum);
    this.setState({schedule: tsched, summary});
  }

  renderDailySchedule() {
    return (
      <Table responsive hover size="sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Daily Interest</th>
            <th>Accrued Interest</th>
            <th>Loan Balance</th>
          </tr>
        </thead>
        <tbody>
        { this.state.schedule.map((k, i) => {
            let prefix = k.repayment ? 'table-success' : '';
            prefix = k.compounding ? 'table-danger' : prefix;
            let title = k.repayment ? 'Repayment today' : '';
            title = k.compounding ? 'Interest compounds today' : title;
            return (
              <tr className={prefix} key={i} title={title}>
                <td>{k.date}</td>
                <td className='text-right'>{k.daily}</td>
                <td className='text-right'>{k.accrued}</td>
                <td className='text-right'>{k.balance}</td>
              </tr>
            )
          })
        }
        </tbody>
      </Table>
    ) 
  }

  renderMonthlySchedule() {
    return (
      <Table responsive hover size="sm">
        <thead>
          <tr>
            <th>Date</th>
            { this.state.schedule[0].principle &&
              <th className='text-right'>Principle</th>
            }
            <th className='text-right'>Interest</th>
            <th className='text-right'>Loan Balance</th>
          </tr>
        </thead>
        <tbody>
        { this.state.schedule.map((k, i) => {
            return (
              <tr key={i}>
                <td>{k.date}</td>
                { k.principle &&
                  <td className='text-right'>{k.principle}</td>
                }
                <td className='text-right'>{k.paccrued}</td>
                <td className='text-right'>{k.balance}</td>
              </tr>
            )
          })
        }
        </tbody>
      </Table>
    ) 
  }

  renderSummaryByYear() {
    if (this.state.summary.year.length <= 1) {
      return null;
    } 

    return (
      <>
        { this.state.summary.year.map((k, i) => {
            return (
              <Row key={i}>
                <Col>Year {k.year} Interest:</Col>
                <Col className='text-right'>${k.interest}</Col>
                <Col xs={3}/>
              </Row>
            )
          })
        }
      </>
    )
  }

  render() {
    return (
      <>
        <h4>Generate a Loan Amortisation Schedule</h4>
        <br/>
        { this.state.incomplete &&
          <Alert variant='danger'>Please enter valid values in <strong>every</strong> field.</Alert>
        }
        <Row>
          <Col>
            <p>Fill out all fields in the form below and select Create Schedule.</p>
            <Form>
              <Row>
                <Col>
                  <Form.Group controlId="amount">
                    <Form.Label>Loan Amount</Form.Label>
                    <Form.Control 
                      type='number'
                      min='0'
                      value={this.state.amount}
                      onChange={this.handleChange}
                    />
                    <Form.Text className="text-muted">
                      The starting loan amount, or an amount taken from a statement on a date which interest was charged (ie no accrued interest).
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="startdate">
                    <Form.Label>as at</Form.Label>
                    <Form.Control 
                      type="date" 
                      placeholder="Enter the date that your loan was this amount."
                      value={this.state.startdate}
                      onChange={this.handleChange}
                    />
                    <Form.Text className="text-muted">
                      Earliest permitted date is 1/1/2019.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group controlId="term">
                    <Form.Label>Loan Term</Form.Label>
                    <Form.Control 
                      as="select" 
                      value={this.state.term}
                      onChange={this.handleTermChange}
                    >
                      <option></option>
                      <option value='6'>6 Months</option>
                      <option value='18'>18 Months</option>
                      <option value='12'>1 Year</option>
                      <option value='24'>2 Years</option>
                      <option value='36'>3 Years</option>
                      <option value='48'>4 Years</option>
                      <option value='60'>5 Years</option>
                      <option value='72'>6 Years</option>
                      <option value='84'>7 Years</option>
                      <option value='96'>8 Years</option>
                      <option value='108'>9 Years</option>
                      <option value='120'>10 Years</option>
                      <option value='132'>11 Years</option>
                      <option value='144'>12 Years</option>
                      <option value='156'>13 Years</option>
                      <option value='168'>14 Years</option>
                      <option value='180'>15 Years</option>
                      <option value='192'>16 Years</option>
                      <option value='204'>17 Years</option>
                      <option value='216'>18 Years</option>
                      <option value='228'>19 Years</option>
                      <option value='240'>20 Years</option>
                      <option value='252'>21 Years</option>
                      <option value='264'>22 Years</option>
                      <option value='276'>23 Years</option>
                      <option value='288'>24 Years</option>
                      <option value='300'>25 Years</option>
                      <option value='312'>26 Years</option>
                      <option value='324'>27 Years</option>
                      <option value='336'>28 Years</option>
                      <option value='348'>29 Years</option>
                      <option value='360'>30 Years</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="rate">
                    <Form.Label>Interest Rate</Form.Label>
                    <InputGroup className="mb-3">
                      <Form.Control 
                        placeholder="Enter interest rate" 
                        type="number" 
                        step="0.01"
                        value={this.state.rate}
                        onChange={this.handleChange}
                      />
                      <InputGroup.Append>
                        <InputGroup.Text>%</InputGroup.Text>
                      </InputGroup.Append>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group controlId="repayment">
                    <Form.Label>Repayment Amount</Form.Label>
                    <Form.Control 
                      placeholder="Enter repayment amount" 
                      value={this.state.repayment}
                      onChange={this.handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="repayfreq">
                    <Form.Label>Repayment Frequency</Form.Label>
                    <Form.Control 
                      as="select" 
                      placeholder="Select repayment frequency" 
                      value={this.state.repayfreq}
                      onChange={this.handleChange}
                    >
                      <option></option>
                      <option value='52'>Weekly</option>
                      <option value='26'>Fortnightly</option>
                      <option value='12'>Monthly</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group controlId="repaydate">
                    <Form.Label>Next Repayment Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      placeholder="Enter next repayment date" 
                      value={this.state.repaydate}
                      onChange={this.handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="compounds">
                    <Form.Label>Interest Compounds</Form.Label>
                    <Form.Control 
                      as="select" 
                      value={this.state.compounds}
                      onChange={this.handleChange}
                    >
                      <option></option>
                      <option value='month'>1st of the Month</option>
                      <option value='repayment'>Same day as repayments</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group>
                <Form.Label>Generate Schedule</Form.Label>
                <div key='inline-radio' className="mb-3">
                  <Form.Check 
                    inline 
                    label='Daily' 
                    name='display' 
                    value='daily'
                    type='radio' 
                    disabled={this.state.term === '360'}
                    onChange={this.handleChange}
                    id='gen-daily' />
                  <Form.Check 
                    inline 
                    label="Weekly / Fortnightly / Monthly" 
                    name='display'
                    value='monthly'
                    type='radio' 
                    checked={this.state.display === 'monthly'}
                    onChange={this.handleChange}
                    id='gen-monthly' />
                </div>
              </Form.Group>
              <Button variant="success" onClick={this.generate}>Create Schedule</Button>
            </Form>
            <br/>
            <p>Assumptions:</p>
            <ul>
              <li>Interest accrued daily.</li>
              <li>Daily interest is calculated after adding repayment or interest compounding adjustment.</li>
            </ul>
          </Col>
          { this.state.schedule && this.state.schedule.length !== 0 &&
            <Col>
              <Card>
                <Card.Body>
                <h5>Loan Summary</h5>
                <Row>
                  <Col>Start date:</Col>
                  <Col className='text-right'>{this.state.summary.sdate}</Col>
                  <Col xs={3}/>
                </Row>
                <Row>
                  <Col>End date:</Col>
                  <Col className='text-right'>{this.state.summary.edate}</Col>
                  <Col xs={3}/>
                </Row>
                <Row>
                  <Col>Start balance:</Col>
                  <Col className='text-right'>${this.state.summary.amount}</Col>
                  <Col xs={3}/>
                </Row>
                <Row>
                  <Col>End balance:</Col>
                  <Col className='text-right'>${this.state.schedule[this.state.schedule.length -1].balance}</Col>
                  <Col xs={3}/>
                </Row>
                <Row>
                  <Col>Total repayments:</Col>
                  <Col className='text-right'>${this.state.summary.repayment}</Col>
                  <Col xs={3}/>
                </Row>
                <Row>
                  <Col>Total interest:</Col>
                  <Col className='text-right'>${this.state.summary.interest}</Col>
                  <Col xs={3}/>
                </Row>
                <Row>
                  <Col>Total principle paid:</Col>
                  <Col className='text-right'>${this.state.summary.principle}</Col>
                  <Col xs={3}/>
                </Row>
                {this.renderSummaryByYear()}
                </Card.Body>
              </Card>
              <br/>
							<h5>Amortisation Schedule</h5>
              {this.state.summary.display === 'daily' && this.renderDailySchedule()}
              {this.state.summary.display === 'monthly' && this.renderMonthlySchedule()}
            </Col>
          }
        </Row>
      </>
    );
  }
}

export default LoanAmortisation;
