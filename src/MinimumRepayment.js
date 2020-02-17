import React, { useEffect, useReducer, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Big from 'big.js';
import { saveState, loadState } from './App';
import { storageKey as laKey } from './LoanAmortisation';

const storageKey = 'la-mrp';

function reducer (state, {field, value}) {
  return {
    ...state,
    [field]: value
  }
}

const MinimumRepayment = (props) => {
  const initialState = loadState(storageKey) !== undefined ? loadState(storageKey) :
                        {
                          amount: '',
                          rate: '',
                          term: '',
                          mterm: undefined,
                          alert: undefined
                        };
  
  const [state, dispatch] = useReducer(reducer, initialState);
  const [alert, setAlert] = useState(null);

  const onChange = (e) => {
    dispatch({field: e.target.name, value: e.target.value});
  }

  const {amount, rate, mrate, term } = state;

  useEffect(() => {
    dispatch({field: 'mrate', value: rate / 1200})
  },[rate]);

  useEffect(() => {
  },[state]);

  const calculateMinimumRepayment = () => {

    if (amount === '' || rate === '' || term === '') {
      setAlert(<Alert variant='danger'>Please enter valid values in <strong>every</strong> field.</Alert>);
      return;
    }

    const rpv = Big(mrate).times(Big(amount));
    const denom = Big(1).minus((Big(1).plus(Big(mrate))).pow(term * -1));
    const mrp = rpv.div(denom).toFixed(2);
    dispatch({field: 'mrp', value: mrp});

    const laState = loadState(laKey) !== undefined ? 
                    loadState(laKey) : {};

    saveState (storageKey, {...state});
    saveState (laKey, 
      {...laState, 
        amount: amount,
        rate: rate,
        term: term,
        repayment: mrp,
        compounds: 'month',
        repayfreq: 'Monthly',
        summary: {},
        schedule: undefined
      });
    setAlert(<Alert variant='danger'>Minimum monthly repayment on this loan is <strong>${mrp}</strong>.</Alert>);
  }

  return (
    <>
        <h4>Calculate Minimum Loan Repayment Amount</h4>
        <Form>
          <Row>
            <Col>
              <Form.Group controlId="amount">
                <Form.Label>Loan Amount</Form.Label>
                <Form.Control 
                  name='amount'
                  type='number'
                  min='0'
                  value={amount}
                  onChange={onChange}
                />
                <Form.Text className="text-muted">
                  The starting loan amount, or the amount of a property you are looking at.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="rate">
                <Form.Label>Interest Rate</Form.Label>
                <Form.Control 
                  name='rate'
                  type='number'
                  min='0'
                  value={rate}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="term">
                <Form.Label>Loan Term</Form.Label>
                <Form.Control 
                  name='term'
                  as="select" 
                  onChange={onChange}
                  value={term} >
                  <option></option>
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
          </Row>
          <Button variant="success" onClick={calculateMinimumRepayment}>Calculate</Button>
          <Button variant="success" className='float-right' onClick={props.next}>Continue to Amortisation Schedule ></Button>
        </Form>
        <br/>
        {alert}
    </>
  )
}

export default MinimumRepayment;
