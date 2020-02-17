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
                          freq: '',
                          mterm: undefined,
                          alert: undefined
                        };
  
  const [state, dispatch] = useReducer(reducer, initialState);
  const [alert, setAlert] = useState(null);

  const onChange = (e) => {
    dispatch({field: e.target.name, value: e.target.value});
  }

  const {amount, rate, urate, uterm, term, freq } = state;

  useEffect(() => {
    // dispatch({field: 'mrate', value: rate / 1200});
    dispatch({field: 'urate', value: rate / (freq * 100)});
    dispatch({field: 'uterm', value: term * freq });
  },[rate, freq, term]);

  useEffect(() => {
  },[state]);

  const calculateMinimumRepayment = () => {

    if (amount === '' || rate === '' || term === '') {
      setAlert(<Alert variant='danger'>Please enter valid values in <strong>every</strong> field.</Alert>);
      return;
    }

    const rpv = Big(urate).times(Big(amount));
    const denom = Big(1).minus((Big(1).plus(Big(urate))).pow(uterm * -1));
    const mrp = rpv.div(denom).toFixed(2);
    dispatch({field: 'mrp', value: mrp});

    const laState = loadState(laKey) !== undefined ? 
                    loadState(laKey) : {};

    console.log('freq', freq)
    saveState (storageKey, {...state});
    saveState (laKey, 
      {...laState, 
        amount: amount,
        rate: rate,
        term: (term * 12),
        repayment: mrp,
        compounds: 'month',
        repayfreq: parseInt(freq),
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
                  <option value='1'>1 Year</option>
                  <option value='2'>2 Years</option>
                  <option value='3'>3 Years</option>
                  <option value='4'>4 Years</option>
                  <option value='5'>5 Years</option>
                  <option value='6'>6 Years</option>
                  <option value='7'>7 Years</option>
                  <option value='8'>8 Years</option>
                  <option value='9'>9 Years</option>
                  <option value='10'>10 Years</option>
                  <option value='11'>11 Years</option>
                  <option value='12'>12 Years</option>
                  <option value='13'>13 Years</option>
                  <option value='14'>14 Years</option>
                  <option value='15'>15 Years</option>
                  <option value='16'>16 Years</option>
                  <option value='17'>17 Years</option>
                  <option value='18'>18 Years</option>
                  <option value='19'>19 Years</option>
                  <option value='20'>20 Years</option>
                  <option value='21'>21 Years</option>
                  <option value='22'>22 Years</option>
                  <option value='23'>23 Years</option>
                  <option value='24'>24 Years</option>
                  <option value='25'>25 Years</option>
                  <option value='26'>26 Years</option>
                  <option value='27'>27 Years</option>
                  <option value='28'>28 Years</option>
                  <option value='29'>29 Years</option>
                  <option value='30'>30 Years</option>
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="term">
                <Form.Label>Repayment Frequency</Form.Label>
                <Form.Control 
                  name='freq'
                  as="select" 
                  onChange={onChange}
                  value={freq} >
                  <option/>
                  <option value='12'>Monthly</option>
                  <option value='26'>Fortnightly</option>
                  <option value='52'>Weekly</option>
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
