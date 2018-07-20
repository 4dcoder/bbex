import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';
import Spinners from 'react-spinners';
import Loadable from 'react-loadable';

import './mobile.css';

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

const SignUp = asyncComponent(() => import('./signup'));

const NormalRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={props => <Component {...props} {...rest} />} />
);

class Mobile extends Component {
  state = {
    localization: this.props.localization
  };

  handleGetLocalization = localization => {
    this.setState({ localization });
  };

  componentWillMount() {
    const viewport = document.createElement('meta');
    viewport.id = 'viewport';
    viewport.setAttribute('name', 'viewport');
    viewport.setAttribute(
      'content',
      'user-scalable=no,width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0'
    );
    document.head.appendChild(viewport);
  }

  render() {
    const { match, location } = this.props;
    const { localization } = this.state;
    const { pathname, search } = location;
    return (
      <div className="mobile-wrap">
        {pathname.indexOf('signup') === -1 && <Redirect from={`${match.path}`} to={`${match.path}/signup${search}`} />}
        <NormalRoute path={`${match.path}/signup`} component={SignUp} {...{ localization }} />
      </div>
    );
  }
}

export default Mobile;
