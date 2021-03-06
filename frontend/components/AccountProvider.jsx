import React from 'react';
import PropTypes from 'prop-types';

const { LoginContext, getLoginInfo, logout } = require('../auth');

class AccountProvider extends React.Component {
  constructor() {
    super();
    this.logout = this.logout.bind(this);
    this.afterLogin = this.afterLogin.bind(this);
    this.state = {
      login: {
        loading: true,
        loginInfo: null,
        onLogout: this.logout,
        onLogin: this.afterLogin,
      },
    };
  }

  componentDidMount() {
    this.afterLogin();
  }

  logout() {
    logout().then(() => {
      this.setState({
        login: {
          loginInfo: null,
          loading: false,
          onLogout: this.logout,
          onLogin: this.afterLogin,
        },
      });
    }).catch((error) => {
      console.error(`Failed to logout due to an error: ${error}`);
    });
  }

  afterLogin() {
    getLoginInfo().then((li) => {
      this.setState({
        login: {
          loginInfo: li,
          loading: false,
          onLogout: this.logout,
          onLogin: this.afterLogin,
        },
      });
    });
  }

  render() {
    const { login } = this.state;
    const { children } = this.props;
    return (
      <LoginContext.Provider value={login}>
        { children }
      </LoginContext.Provider>
    );
  }
}

AccountProvider.propTypes = {
  children: PropTypes.node,
};

AccountProvider.defaultProps = {
  children: undefined,
};

export default AccountProvider;
