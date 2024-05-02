import React from "react";
import { Button } from "reactstrap";
import { useLogin } from "tapis-hooks/authenticator";
import { useTapisConfig } from "tapis-hooks/context";
import {FormikInput, LoadingSpinner, Message} from "tapis-ui/_common";
import { SubmitWrapper } from "tapis-ui/_wrappers";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import styles from "./Login.module.scss";

const Login: React.FC = () => {
  const { login, isLoading, error } = useLogin();
  const { accessToken } = useTapisConfig();

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
    username: "",
    password: "",
  };

  return (
    <>
      <div className={styles["form-header"]}>
        <div className={styles["form-header-text"]}>C-Maiki Gateway Login</div>
      </div>
      <div className={styles["form"]}>
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
            <div className={styles["submit-section"]}>
              <Button
                type="submit"
                disabled={isLoading || accessToken != null}
              >
                Log In
              </Button>
              <div className={styles["status"]}>
                {isLoading && (
                  <LoadingSpinner
                    className={styles['loading-spinner']}
                    placement="inline"
                  />
                )}
                {error && (
                  <Message canDismiss={false} type="error" scope="inline">
                    {(error as any)?.message ?? error}
                  </Message>
                )}
              </div>
              <div className={styles["forgot-password"]}>
                <a
                  href="https://www.hawaii.edu/username/userprefs/password_only.cgi"
                  className={styles["forgot-password-text"]}
                >
                  Forgot Password
                </a>
              </div>
            </div>
          </Form>
        </Formik>
      </div>
    </>
  );
};

export default Login;
