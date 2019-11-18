import React, { Component } from 'react';
import moment from 'moment';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Big from 'big.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const key = 'loan-state';

const frequency = {
  'Weekly': 7,
  'Fortnightly': 14 
}

/* 
 * Load state from sessionStorage.
 */
const loadState = () => {
    try {
        const serializedState = sessionStorage.getItem(key);
        if (serializedState == null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    }
    catch (err) {
        return undefined;
    }
};

/* 
 * Save state to sessionStorage.
 */
const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        sessionStorage.setItem(key, serializedState);
    }
    catch (err){
        console.log("error saving state to sessionStorage", key, state);
    }
};

class App extends Component {
	
  constructor(props) {
    super(props);
    this.state = { 
      amount: '',
      date: '',
      rate: '',
      compounds: '',
      repayment: '',
      repaydate: '',
      repayfreq: '',
      enddate: '',
      display: 'daily',
      summary: {},
      schedule: undefined
    };
    this.handleChange = this.handleChange.bind(this);
    this.generate = this.generate.bind(this);
  }

  componentDidMount() {
    const persistedState = loadState();
  
		/*
		 * handle page refreshes without losing state.
		 */
    if (persistedState !== undefined) {
      this.setState(loadState());
    }
    else {
      this.setState({
        amount: 100000,
        date: '2019-12-01',
        enddate: '2021-12-01',
        rate: 3.79,
        repayment: 500,
        repaydate: '2019-12-03',
        repayfreq: 'Weekly',
        summary: {},
      });
    }
  }

  handleChange(event) {
    const {name, id, value} = event.target;
    name ? this.setState({[name] : value}) : this.setState({[id] : value});
  }

  repaymentDates() {
    const { enddate, repaydate, repayfreq } = this.state;
    let r = [];

    if (! this.shouldGenerateSchedule()) {
      return r;
    }

    let end = moment(enddate);
    r.push(moment(repaydate));

    let start = moment(repaydate);

    if (this.state.repayfreq === 'Monthly') {
      start.add(1, 'months');

      while (start.isSameOrBefore(end)) {
        r.push(moment(start));
        start.add(1, 'months');
      }
    }
    else {
      start.add(frequency[repayfreq], 'days');

      while (start.isSameOrBefore(end)) {
        r.push(moment(start));
        start.add(frequency[repayfreq], 'days');
      }
    }

    return r;
  }

  isCompoundingDate(current) {
    if (this.state.compounds === 'month') {
      return current.date() === 1;
    }
    return this.isRepaymentDate(current);
  }

  isRepaymentDate(current) {
    const repaymentdates = this.repaymentDates();
    const f = repaymentdates.find((d) => current.isSame(d, 'day')) 
    return f !== undefined;
  }

  /* Basic validation for form.
   * Every form field should be filled.
   */
  shouldGenerateSchedule() {
    if (Object.values(this.state).every((a) => a !== '')) {
      let ldate = moment(this.state.date);
      let rdate = moment(this.state.repaydate);
      let edate = moment(this.state.enddate);

      // Prevent schedules for crazy length periods
      if (ldate.isBefore(moment('2019-01-01'))) {
        this.setState({incomplete: true});
        return false;
      }
      // Limit loan period to 5 years
      if (edate.isAfter(moment(ldate).add(5, 'years'))) {
        this.setState({incomplete: true});
        return false;
      }
      if (rdate.isBefore(ldate) || edate.isBefore(ldate)) {
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
  }

  generate() {
    saveState(this.state);
    if (! this.shouldGenerateSchedule()) {
      this.setState({schedule: undefined});
      return;
    }

    let bamount = Big(this.state.amount);
    let daily = this.dailyInterest(bamount);
    let enddate = moment(this.state.enddate);

    let accrued = Big(0);
    let paccrued = Big(0);

    /* Generate data for the schedule and summary.
    */
    let tsched = [];
    let summary = {samount: bamount.toFixed(2),
                   interest: Big(0),
                   repayment: Big(0)
                  };

    for (var m = moment(this.state.date); m.isSameOrBefore(enddate); m.add(1, 'days')) {

      if (this.isRepaymentDate( m )) {
        /* On a repayment date, reduce loan balance and calculate new
         * daily interest.
         */
        bamount = bamount.minus(this.state.repayment);
        daily = this.dailyInterest(bamount);
        summary.repayment = summary.repayment.add(this.state.repayment);
      } 
      if (this.isCompoundingDate( m )) {
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

      /* Update the schedule data depending on the display type selected.
       */
      if ((this.state.display === 'monthly' &&
          this.isCompoundingDate( m )) ||
          this.state.display === 'daily') {
        tsched.push({date: m.format('DD/MM/YYYY'),
                      balance: bamount.toFixed(2),
                      accrued: accrued.toFixed(2),
                      paccrued: paccrued.toFixed(2),
                      daily: daily.toFixed(2),
                      repayment: this.isRepaymentDate(m),
                      compounding: this.isCompoundingDate(m) }
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

    summary.principal = summary.repayment.minus(summary.interest).toFixed(2);
    summary.interest = summary.interest.toFixed(2);
    summary.repayment = summary.repayment.toFixed(2);
    summary.sdate = moment(this.state.date).format('DD/MM/YYYY');
    summary.edate = moment(this.state.enddate).format('DD/MM/YYYY');
    summary.amount = this.state.amount;
    summary.display = this.state.display;
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
            <th className='text-right'>Interest (previous period)</th>
            <th className='text-right'>Loan Balance</th>
          </tr>
        </thead>
        <tbody>
        { this.state.schedule.map((k, i) => {
            return (
              <tr key={i}>
                <td>{k.date}</td>
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

  render() {
    return (
      <Container>
        <h1>Generate a Loan Amortisation Schedule</h1>
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
                      This should be the starting loan amount, or an amount taken from a statement on a date which interest was charged (ie no accrued interest).
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="date">
                    <Form.Label>as at</Form.Label>
                    <Form.Control 
                      type="date" 
                      placeholder="Enter the date that your loan was this amount."
                      value={this.state.date}
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
                <Col>
                  <Form.Group controlId="compounds">
                    <Form.Label>Interest Compounds</Form.Label>
                    <Form.Control 
                      as="select" 
                      placeholder="When does interest compound?" 
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
                      <option>Weekly</option>
                      <option>Fortnightly</option>
                      <option>Monthly</option>
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
                  <Form.Group controlId="enddate">
                    <Form.Label>Loan Refinance Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      placeholder="Enter the date fixed loan is to be refinanced" 
                      value={this.state.enddate}
                      onChange={this.handleChange}
                    />
                    <Form.Text className="text-muted">
                      No more than 5 years from the start date.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group controlId="enddate">
                <Form.Label>Generate Schedule</Form.Label>
                <div key='inline-radio' className="mb-3">
                  <Form.Check 
                    inline 
                    label='Daily' 
                    name='display' 
                    value='daily'
                    type='radio' 
                    onChange={this.handleChange}
                    id='gen-daily' />
                  <Form.Check 
                    inline 
                    label="Weekly / Fortnightly / Monthly" 
                    name='display'
                    value='monthly'
                    type='radio' 
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
                  <Col>{this.state.summary.sdate}</Col>
                </Row>
                <Row>
                  <Col>End date:</Col>
                  <Col>{this.state.summary.edate}</Col>
                </Row>
                <Row>
                  <Col>Start balance:</Col>
                  <Col>${this.state.summary.amount}</Col>
                </Row>
                <Row>
                  <Col>End balance:</Col>
                  <Col>${this.state.schedule[this.state.schedule.length -1].balance}</Col>
                </Row>
                <Row>
                  <Col>Total repayments:</Col>
                  <Col>${this.state.summary.repayment}</Col>
                </Row>
                <Row>
                  <Col>Total interest:</Col>
                  <Col>${this.state.summary.interest}</Col>
                </Row>
                <Row>
                  <Col>Total principal paid:</Col>
                  <Col>${this.state.summary.principal}</Col>
                </Row>
                </Card.Body>
              </Card>
              <br/>
							<h5>Amortisation Schedule</h5>
              {this.state.summary.display === 'daily' && this.renderDailySchedule()}
              {this.state.summary.display === 'monthly' && this.renderMonthlySchedule()}
            </Col>
          }
        </Row>
      </Container>
    );
  }
}

export default App;
