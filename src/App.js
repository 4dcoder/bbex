import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import Spinners from 'react-spinners';
import Loadable from 'react-loadable';
import Container from './views/Container';
import request from './utils/request';

import './App.css';
import './assets/fonts/iconfont.css';

const Loading = ({ isLoading, timedOut, pastDelay, error }) => {
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
    } else if (error) {
        return <div>Error! Component failed to load</div>;
    } else {
        return null;
    }
};

const Home = Loadable({
    loader: () => import('./views/home'),
    loading: Loading
});

const Trade = Loadable({
    loader: () => import('./views/trade'),
    loading: Loading
});

const SignIn = Loadable({
    loader: () => import('./views/signin'),
    loading: Loading
});

const SignUp = Loadable({
    loader: () => import('./views/signup'),
    loading: Loading
});

const Reset = Loadable({
    loader: () => import('./views/reset'),
    loading: Loading
});

const ResetPassword = Loadable({
    loader: () => import('./views/reset/Password'),
    loading: Loading
});

const User = Loadable({
    loader: () => import('./views/user'),
    loading: Loading
});

const Authentication = Loadable({
    loader: () => import('./views/authentication'),
    loading: Loading
});

const C2c = Loadable({
    loader: () => import('./views/c2c'),
    loading: Loading
});

const Detail = Loadable({
    loader: () => import('./views/notice/Detail'),
    loading: Loading
});

const Notice = Loadable({
    loader: () => import('./views/notice'),
    loading: Loading
});

const NotFound = Loadable({
    loader: () => import('./views/404'),
    loading: Loading
});

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
                <Container
                    request={request}
                    {...{ localization }}
                    onGetLocalization={this.handleGetLocalization}
                >
                    <Switch>
                        <NormalRoute exact path="/" component={Home} {...{ localization }} />
                        <NormalRoute path="/trade" component={Trade} {...{ localization }} />
                        <NormalRoute path="/signin" component={SignIn} {...{ localization }} />
                        <NormalRoute path="/signup" component={SignUp} {...{ localization }} />
                        <NormalRoute path="/reset" component={Reset} {...{ localization }} />
                        <NormalRoute
                            path="/resetPassword"
                            component={ResetPassword}
                            {...{ localization }}
                        />
                        <PrivateRoute path="/user" component={User} {...{ localization }} />
                        <PrivateRoute
                            path="/authentication"
                            component={Authentication}
                            {...{ localization }}
                        />
                        <NormalRoute path="/c2c" component={C2c} {...{ localization }} />
                        <NormalRoute
                            exact
                            path="/notice"
                            component={Notice}
                            {...{ localization }}
                        />
                        <NormalRoute path="/notice/:id" component={Detail} {...{ localization }} />
                        <NormalRoute path="*" component={NotFound} {...{ localization }} />
                    </Switch>
                </Container>
            </Router>
        );
    }
}

export default App;
