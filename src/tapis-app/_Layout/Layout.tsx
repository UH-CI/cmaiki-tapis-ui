import React, { useState } from "react";
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
import { QueryWrapper } from "tapis-ui/_wrappers";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars} from "@fortawesome/free-solid-svg-icons";

const Layout: React.FC = () => {
  const { accessToken, claims } = useTapisConfig();
  const { data, isLoading, error } = useList();
  const tenants = data?.result ?? [];
  const history = useHistory();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const { logout } = useLogin();

  const header = (
    <div className="tapis-ui__header">
      <FontAwesomeIcon className="hamburger" onClick={() => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
      }} icon={faBars}/>
      <div className="tapis-ui__header-icon">
        <a href="/dashboard">
          <img
            src={`${process.env.PUBLIC_URL}/hawaii-thumb-inverted.png`}
            alt="Icon"
            className="tapis-ui__header-icon-image"
          />
        </a>
      </div>
      <div className="tapis-ui__header-title">C-MAIKI Gateway</div>
      <div>
        {claims["sub"] && (
          <ButtonDropdown
            size="sm"
            isOpen={isDropdownOpen}
            toggle={() => setIsDropdownOpen(!isDropdownOpen)}
            className="dropdown-button"
          >
            <DropdownToggle caret>{claims["sub"]}</DropdownToggle>
            <DropdownMenu style={{maxHeight: "50vh", overflowY: "scroll"}}>
              <DropdownItem header>Tenants</DropdownItem>
              <DropdownItem divider/>
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
              <DropdownItem divider/>
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
          <PageLayout top={header} left={<Sidebar collapsed={isSidebarCollapsed} />} right={workbenchContent} />
        ) : (
          <PageLayout top={<Login />} />
        )}
      </div>
    </NotificationsProvider>
  );
};

export default Layout;
