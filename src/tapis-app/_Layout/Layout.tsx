import React, { useEffect, useState } from "react";
import { Sidebar } from "tapis-app/_components";
import { Router } from "tapis-app/_Router";
import { PageLayout } from "tapis-ui/_common";
import { NotificationsProvider } from "tapis-app/_components/Notifications";
import Login from "tapis-app/Login";
import { useHistory } from "react-router-dom";
import { useList } from "tapis-hooks/tenants";
import "./Layout.scss";
import { useTapisConfig } from "tapis-hooks";
import { useLogin } from "tapis-hooks/authenticator";
import {
  ButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { QueryWrapper } from "tapis-ui/_wrappers";

const Layout: React.FC = () => {
  const { accessToken, claims } = useTapisConfig();
  const { data, isLoading, error } = useList();
  const tenants = data?.result ?? [];
  const history = useHistory();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { logout } = useLogin();
  // token expiry calculation
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(interval);
    }
  }, []);
  const expiresInDate = new Date(accessToken?.expires_at || now); // convert the expiry date string to a date
  const remainingSeconds = (expiresInDate.getTime() - now.getTime()) / 1000; // find the difference between now and expiry time in seconds
  const remainderHours = Math.floor(remainingSeconds / 60 / 60);
  const remainderMinutes = Math.floor((remainingSeconds / 60) - (remainderHours * 60));
  const remainderSeconds = Math.floor(remainingSeconds - (remainderMinutes * 60) - (remainderHours * 60 * 60));

  const header = (
    <div className="tapis-ui__header">
      <a href="/dashboard">
        <img
          src={`${process.env.PUBLIC_URL}/hawaii-thumb-inverted.png`}
          alt="Icon"
          className="tapis-ui__header-icon"
        />
      </a>
      <div className="tapis-ui__header-title">C-MAIKI Gateway</div>
      <div></div>
      <div className="tapis-ui__header-right">
        <div>
          <FontAwesomeIcon icon={faClock} />
        </div>
        <div className="tapis-ui__header-right-token">
          Token expires in:{' '}
          {remainderHours > 0 ? remainderHours + ' hours, ' : ''}
          {remainderMinutes > 0 && remainderHours > 0 ? remainderMinutes + ' minutes, ' : ''}
          {remainderSeconds + ' seconds'}
        </div>
        {claims["sub"] && (
          <ButtonDropdown
            size="sm"
            isOpen={isOpen}
            toggle={() => setIsOpen(!isOpen)}
            className="dropdown-button"
          >
            <DropdownToggle caret>{claims["sub"]}</DropdownToggle>
            <DropdownMenu style={{ maxHeight: "50vh", overflowY: "scroll" }}>
              <DropdownItem header>Tenants</DropdownItem>
              <DropdownItem divider />
              <QueryWrapper isLoading={isLoading} error={error}>
                {tenants.map((tenant) => {
                  return (
                    <DropdownItem
                      onClick={() => {
                        logout();
                        window.location.href = tenant.base_url + "/tapis-ui/";
                      }}
                    >
                      {tenant.tenant_id}
                    </DropdownItem>
                  );
                })}
              </QueryWrapper>
              <DropdownItem divider />
              <DropdownItem onClick={() => history.push("/logout")}>
                Logout
              </DropdownItem>
            </DropdownMenu>
          </ButtonDropdown>
        )}
      </div>
    </div>
  );

  const workbenchContent = (
    <div className="workbench-content">
      <Router />
    </div>
  );

  return (
    <NotificationsProvider>
      <div style={{ display: "flex", flexGrow: 1, height: "100vh" }}>
        {accessToken ? (
          <PageLayout top={header} left={<Sidebar />} right={workbenchContent} />
        ) : (
          <PageLayout top={<Login />} />
        )}
      </div>
    </NotificationsProvider>
  );
};

export default Layout;
