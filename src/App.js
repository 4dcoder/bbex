import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { ScaleLoader } from 'react-spinners';
import Loadable from 'react-loadable';
import Container from './views/Container';

import './App.css';

const asyncComponent = loader =>
  Loadable({
    loader,
    loading: () => (
      <div className="page-loading">
        <ScaleLoader color={'#d4a668'} height={100} width={5} margin="5px" radius={5} loading />
      </div>
    ),
    delay: 200
  });

const Home = asyncComponent(() => import('./views/home'));

const Trade = asyncComponent(() => import('./views/trade'));

const SignIn = asyncComponent(() => import('./views/signin'));

const SignUp = asyncComponent(() => import('./views/signup'));

const Reset = asyncComponent(() => import('./views/reset'));

const ResetMail = asyncComponent(() => import('./views/reset/Mail'));

const ResetMobile = asyncComponent(() => import('./views/reset/Mobile'));

const User = asyncComponent(() => import('./views/user'));

const C2c = asyncComponent(() => import('./views/c2c'));

const Notice = asyncComponent(() => import('./views/notice'));

const NoticeDetail = asyncComponent(() => import('./views/notice/Detail'));

const Agreement = asyncComponent(() => import('./views/links/Agreement'));

const MyLink = asyncComponent(() => import('./views/links/MyLink'));

const NotFound = asyncComponent(() => import('./views/404'));

const Mobile = asyncComponent(() => import('./views/mobile'));

const HelpDetail = asyncComponent(() => import('./views/help/Detail'));

const Help = asyncComponent(() => import('./views/help'));

const Mine = asyncComponent(() => import('./views/mine'));

const NormalRoute = ({ component: Component, ...rest }) => (
  <Route render={props => <Component {...props} {...rest} />} />
);

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
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
        <Switch>
          <NormalRoute path="/mobile" component={Mobile} {...{ localization }} />
          <Container {...{ localization }} onGetLocalization={this.handleGetLocalization}>
            <Switch>
              <NormalRoute exact path="/" component={Home} {...{ localization }} />
              <NormalRoute exact path="/trade" component={Trade} {...{ localization }} />
              <NormalRoute exact path="/signin" component={SignIn} {...{ localization }} />
              <NormalRoute exact path="/signup" component={SignUp} {...{ localization }} />
              <NormalRoute exact path="/reset" component={Reset} {...{ localization }} />
              <NormalRoute exact path="/reset/mail" component={ResetMail} {...{ localization }} />
              <NormalRoute
                exact
                path="/reset/mobile"
                component={ResetMobile}
                {...{ localization }}
              />
              <PrivateRoute path="/user" component={User} {...{ localization }} />
              <NormalRoute exact path="/c2c" component={C2c} {...{ localization }} />
              <NormalRoute exact path="/link/:id" component={MyLink} {...{ localization }} />
              <NormalRoute exact path="/agreement" component={Agreement} {...{ localization }} />
              <NormalRoute exact path="/notice" component={Notice} {...{ localization }} />
              <NormalRoute
                exact
                path="/notice/:id"
                component={NoticeDetail}
                {...{ localization }}
              />
              <NormalRoute exact path="/help" component={Help} {...{ localization }} />
              <NormalRoute exact path="/help/:id" component={HelpDetail} {...{ localization }} />
              <NormalRoute exact path="/mine" component={Mine} {...{ localization }} />
              <NormalRoute component={NotFound} {...{ localization }} />
            </Switch>
          </Container>
        </Switch>
      </Router>
    );
  }
}

export default App;
