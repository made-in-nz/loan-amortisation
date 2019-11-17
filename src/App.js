import React, { Component } from 'react';
import moment from 'moment';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import Big from 'big.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const key = 'loan-state';

// Big.DP = 8;

const frequency = {
  'Weekly': 7
}

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
      repayment: '',
      repaydate: '',
      repayfreq: '',
      enddate: '',
      display: 'daily',
      summary: {},
      schedule: undefined
    };
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    const persistedState = loadState();
  
    if (persistedState !== undefined) {
      this.setState(loadState());
    }
    else {
      this.setState({
        amount: 100000,
        date: '2019-10-01',
        rate: 3.79,
        repayment: 500,
        repaydate: '2019-10-03',
        repayfreq: 'Weekly',
        summary: {},
        enddate: ''
      });
    }
  }

  // componentDidUpdate(prevProps) {
  //   // this.generate();
  //   saveState(this.state);
  // }

  handleChange(event) {
    const {name, id, value} = event.target;
    name ? this.setState({[name] : value}, this.generate) : this.setState({[id] : value}, this.generate);
    saveState(this.state);
  }

  repaymentDates() {
    let r = [];

    if (! this.shouldGenerateSchedule()) {
      return r;
    }

    let end = moment(this.state.enddate);
    // end.add(1, 'months').date(1);
    r.push(moment(this.state.repaydate));

    let start = moment(this.state.repaydate);
    start.add(frequency[this.state.repayfreq], 'days');

    while (start.isSameOrBefore(end)) {
      r.push(moment(start));
      start.add(frequency[this.state.repayfreq], 'days');
    }

    return r;
  }

  isCompoundingDate(current) {
    return current.date() === 1;
  }

  isRepaymentDate(current) {
    const repaymentdates = this.repaymentDates();
    const f = repaymentdates.find((d) => current.isSame(d, 'day')) 
    return f !== undefined;
  }

  displayRepaymentDates() {
    const repaydates = this.repaymentDates();
    return (
      <>
        <p>Repayment Dates</p>
        <ul>
          {repaydates.map((d, i) => <li key={i}>{d.format('YYYY-MM-DD')}</li>)}
        </ul>
      </>
    )
  }

  /* Every form field should be filled.
   * repaydate can't be before loan date.
   */
  shouldGenerateSchedule() {
    if (Object.values(this.state).every((a) => a !== '')) {
      let ldate = moment(this.state.date);
      let rdate = moment(this.state.repaydate);
      if (rdate.isBefore(ldate)) {
        return false;
      }
      return true;
    }
    return false;
  }

  dailyInterest(balance) {
      let brate = Big(this.state.rate);
      brate = brate.div(100);
      let annual = balance.times(brate);
      return annual.div(365);
  }


  generate() {
    if (! this.shouldGenerateSchedule()) {
      this.setState({schedule: undefined});
      return;
    }
    // console.log(this.state);

    let bamount = Big(this.state.amount);
    let daily = this.dailyInterest(bamount);
    let enddate = moment(this.state.enddate);

    let accrued = Big(0);
    let paccrued = Big(0);

    /* Generate data for the schedule.
    */
    let tsched = [];
    let summary = {samount: bamount.toFixed(2),
                   interest: Big(0),
                   repayment: Big(0)
                  };
    for (var m = moment(this.state.date); m.isSameOrBefore(enddate); m.add(1, 'days')) {
      if (this.isRepaymentDate( m )) {
        bamount = bamount.minus(this.state.repayment);
        daily = this.dailyInterest(bamount);
        summary.repayment = summary.repayment.add(this.state.repayment);
      } 
      if (this.isCompoundingDate( m )) {
        bamount = bamount.plus(accrued);
        paccrued = accrued;
        accrued = Big(0);
        daily = this.dailyInterest(bamount);
      } 
      accrued = accrued.add(daily);
      summary.interest = summary.interest.add(daily);

      if ((this.state.display === 'monthly' &&
          this.isCompoundingDate( m )) ||
          this.state.display === 'daily') {
        tsched.push({date: m.format('YYYY-MM-DD'),
                      balance: bamount.toFixed(2),
                      accrued: accrued.toFixed(2),
                      paccrued: paccrued.toFixed(2),
                      daily: daily.toFixed(2),
                      repayment: this.isRepaymentDate(m),
                      compounding: this.isCompoundingDate(m) }
                      );
      }
    }
    bamount = bamount.plus(accrued);
    tsched.push({date: 'Final Balance',
                  balance: bamount.toFixed(2),
                  accrued: '',
                  daily: ''}
                  );

    summary.interest = summary.interest.toFixed(2);
    summary.repayment = summary.repayment.toFixed(2);
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
            <th className='text-right'>Interest (previous month)</th>
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
        <Row>
          <Col>
            <p>Fill out all fields in the form below and the amortisation schedule will automatically generate.</p>
            <Form>
              <Row>
                <Col>
                  <Form.Group controlId="amount">
                    <Form.Label>Loan Amount</Form.Label>
                    <Form.Control 
                      placeholder="Enter the loan amount from a statement on the date that interest has been charged." 
                      type='number'
                      min='0'
                      name="amount"
                      value={this.state.amount}
                      onChange={this.handleChange}
                    />
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
                <Col/>
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
                      {/* <option>Monthly</option> */}
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
                    label="Monthly" 
                    name='display' 
                    value='monthly'
                    type='radio' 
                    onChange={this.handleChange}
                    id='gen-monthly' />
                </div>
              </Form.Group>
            </Form>
            {this.displayRepaymentDates()}
            <p>Assumptions:</p>
            <ul>
              <li>Interest charged monthly on the first of the month.</li>
              <li>Interest accrued daily.</li>
              <li>Daily interest is calculated after adding repayment or interest compounding adjustment.</li>
            </ul>
          </Col>
          { this.state.schedule && this.state.schedule.length !== 0 &&
            <Col>
              {/* <h2>Schedule</h2> */}
              <Card>
                <Card.Body>
                <h5>Summary</h5>
                <Row>
                  <Col>Start date:</Col>
                  <Col>{this.state.date}</Col>
                </Row>
                <Row>
                  <Col>End date:</Col>
                  <Col>{this.state.enddate}</Col>
                </Row>
                <Row>
                  <Col>Start balance:</Col>
                  <Col>${this.state.amount}</Col>
                </Row>
                <Row>
                  <Col>End balance:</Col>
                  <Col>${this.state.schedule[this.state.schedule.length -1].balance}</Col>
                </Row>
                <Row>
                  <Col>Total interest:</Col>
                  <Col>${this.state.summary.interest}</Col>
                </Row>
                <Row>
                  <Col>Total repayments:</Col>
                  <Col>${this.state.summary.repayment}</Col>
                </Row>
                </Card.Body>
              </Card>
              {this.state.display === 'daily' && this.renderDailySchedule()}
              {this.state.display === 'monthly' && this.renderMonthlySchedule()}
            </Col>
          }
        </Row>
      </Container>
    );
  }
}

export default App;
