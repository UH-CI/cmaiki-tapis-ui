import React, { useState } from 'react';
import { Button } from 'reactstrap';
import {
  Authenticator as AuthenticatorHooks,
  useTapisConfig,
} from '@tapis/tapisui-hooks';
import { FormikInput, SubmitWrapper } from '@tapis/tapisui-common';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useExtension } from 'extensions';
import { Implicit } from '@tapis/tapisui-extensions-core/dist/oauth2';
import styles from './Login.module.scss';
import { Message } from '@mui/icons-material';

const Login: React.FC = () => {
  const { login, isLoading, error } = AuthenticatorHooks.useLogin();
  const { accessToken } = useTapisConfig();
  const { extension } = useExtension();
  const [activeAuthMethod, setActiveAuthMethod] = useState<
    undefined | 'implicit' | 'password'
  >(undefined);

  let implicitAuthURL: string | undefined = undefined;
  let passwordAuth = extension === undefined;
  if (extension) {
    let implicitAuth = extension.getAuthByType('implicit') as Implicit;
    implicitAuthURL =
      implicitAuth.authorizationPath +
      `?client_id=${implicitAuth.clientId}&response_type=${
        implicitAuth.responseType
      }&redirect_uri=${encodeURIComponent(implicitAuth.redirectURI)}`;
    // TODO Remove below. Testing only
    // implicitAuthURL =
    //   implicitAuth.authorizationPath +
    //   `?client_id=${implicitAuth.clientId}&response_type=${
    //     implicitAuth.responseType
    //   }&redirect_uri=${encodeURIComponent('http://localhost:3000/#/oauth2')}`;

    passwordAuth =
      (extension.getAuthByType('password') as boolean | undefined) || false;
  }

  const onSubmit = ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => login(username, password);

  const loginSchema = Yup.object({
    username: Yup.string().required(),
    password: Yup.string().required(),
  });

  const initialValues = {
    username: '',
    password: '',
  };

  return (
    <>
      {passwordAuth && (
        <>
          <div className={styles['form-header']}>
            <div className={styles['form-header-text']}>
              C-Maiki Gateway Login
            </div>
          </div>
          <div className={styles['form']}>
            <Formik
              initialValues={initialValues}
              validationSchema={loginSchema}
              onSubmit={onSubmit}
            >
              <Form>
                <FormikInput
                  name="username"
                  label="Username"
                  required={true}
                  description="Your TAPIS username"
                  darkBG
                />
                <FormikInput
                  name="password"
                  label="Password"
                  required={true}
                  description="Your TAPIS password"
                  type="password"
                  darkBG
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <SubmitWrapper
                    isLoading={isLoading}
                    error={error}
                    success={accessToken && 'Successfully logged in'}
                  >
                    <div className={styles['submit-section']}>
                      {!isLoading && (
                        <Button
                          type="submit"
                          disabled={isLoading || accessToken != null}
                          style={{ width: '5.5em' }}
                        >
                          Log In
                        </Button>
                      )}
                    </div>
                  </SubmitWrapper>
                </div>
              </Form>
            </Formik>
          </div>
        </>
      )}
    </>
  );
};

export default Login;
