import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import Spinners from 'react-spinners';
import Loadable from 'react-loadable';
import Container from './views/Container';
import Trade from './views/trade';
// import asyncComponent from './components/AsyncComponent';

import './App.css';

const asyncComponent = loader =>
  Loadable({
    loader,
    loading: ({ isLoading, timedOut, pastDelay }) => {
      if (isLoading) {
        if (timedOut) {
          return <div>Loader timed out!</div>;
        } else if (pastDelay) {
          return (
            <div className="page-loading">
              <Spinners.ScaleLoader
                color={'#d4a668'}
                height={100}
                width={5}
                margin="5px"
                radius={5}
                loading
              />
            </div>
          );
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    delay: 100,
    timeout: 10000
  });

const Home = asyncComponent(() => import('./views/home'));

// const Trade = asyncComponent(() => import('./views/trade'));

const SignIn = asyncComponent(() => import('./views/signin'));

const SignUp = asyncComponent(() => import('./views/signup'));

const Reset = asyncComponent(() => import('./views/reset'));

const ResetPassword = asyncComponent(() => import('./views/reset/Password'));

const User = asyncComponent(() => import('./views/user'));

const Authentication = asyncComponent(() => import('./views/authentication'));

const C2c = asyncComponent(() => import('./views/c2c'));

const Notice = asyncComponent(() => import('./views/notice'));

const Detail = asyncComponent(() => import('./views/notice/Detail'));

const Agreement = asyncComponent(() => import('./views/links/Agreement'));

const MyLink = asyncComponent(() => import('./views/links/MyLink'));

const NotFound = asyncComponent(() => import('./views/404'));

const NormalRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={props => <Component {...props} {...rest} />} />
);

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      sessionStorage.getItem('account') ? (
        <Component {...props} {...rest} />
      ) : (
        <Redirect to="/signin" />
      )
    }
  />
);

class App extends Component {
  state = {
    localization: {}
  };

  handleGetLocalization = localization => {
    this.setState({ localization });
  };

  render() {
    const { localization } = this.state;
    return (
      <Router>
        <Container {...{ localization }} onGetLocalization={this.handleGetLocalization}>
          <Switch>
            <NormalRoute exact path="/" component={Home} {...{ localization }} />
            <NormalRoute path="/trade" component={Trade} {...{ localization }} />
            <NormalRoute path="/signin" component={SignIn} {...{ localization }} />
            <NormalRoute path="/signup" component={SignUp} {...{ localization }} />
            <NormalRoute path="/reset" component={Reset} {...{ localization }} />
            <NormalRoute path="/resetPassword" component={ResetPassword} {...{ localization }} />
            <PrivateRoute path="/user" component={User} {...{ localization }} />
            <PrivateRoute path="/authentication" component={Authentication} {...{ localization }} />
            <NormalRoute path="/c2c" component={C2c} {...{ localization }} />
            <NormalRoute path="/link/:id" component={MyLink} {...{ localization }} />
            <NormalRoute path="/agreement" component={Agreement} {...{ localization }} />
            <NormalRoute exact path="/notice" component={Notice} {...{ localization }} />
            <NormalRoute path="/notice/:id" component={Detail} {...{ localization }} />
            <NormalRoute path="*" component={NotFound} {...{ localization }} />
          </Switch>
        </Container>
      </Router>
    );
  }
}

export default App;
