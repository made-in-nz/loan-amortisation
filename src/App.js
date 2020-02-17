import React, { useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import MinimumRepayment from './MinimumRepayment';
import LoanAmortisation from './LoanAmortisation';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

/* 
 * Load state from sessionStorage.
 */
export const loadState = (key) => {
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
export const saveState = (key, state) => {
    try {
        const serializedState = JSON.stringify(state);
        sessionStorage.setItem(key, serializedState);
    }
    catch (err){
        console.log("error saving state to sessionStorage", key, state);
    }
};

const App = () => {
    
    const [active, setActive] = useState(1);

    const renderLoanAmortisation = () => {
        setActive(2);
    }


    const renderPage = () => {
        switch (active) {
            case 1:
                return <MinimumRepayment next={renderLoanAmortisation}/>
            case 2:
                return <LoanAmortisation/>
            default:
                return <MinimumRepayment next={renderLoanAmortisation}/>
        }
    }

  return (
    <Container>
        <Card>
        <Card.Body>
        <Nav
            fill 
            variant="tabs" 
            activeKey={active}
            onSelect={selectedKey => setActive(parseInt(selectedKey))}
            >
            <Nav.Item>
                <Nav.Link href="#" eventKey={1}>Minimum Repayment Calculator</Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey={2}>Loan Amortisation Schedule</Nav.Link>
            </Nav.Item>
        </Nav>
        <br/>
        {renderPage()}
        </Card.Body>
        </Card>
    </Container>
  )
}

export default App;
