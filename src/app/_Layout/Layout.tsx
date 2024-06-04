import React, { useState } from 'react';
import { Sidebar } from 'app/_components';
import { Router } from 'app/_Router';
import { PageLayout } from '@tapis/tapisui-common';
import { NotificationsProvider } from 'app/_components/Notifications';
import { useHistory } from 'react-router-dom';
import { Tenants as Hooks } from '@tapis/tapisui-hooks';
import './Layout.scss';
import { useTapisConfig } from '@tapis/tapisui-hooks';
import { useExtension } from "extensions"
import {
  ButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { QueryWrapper } from '@tapis/tapisui-common';

const Layout: React.FC = () => {
  const { claims } = useTapisConfig();
  const { extension } = useExtension()
  extension!.configuration!.logo!.url = "data:image/jpeg;base64,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"
  const { data, isLoading, error } = Hooks.useList();
  const result = data?.result ?? [];
  const tenants = result;
  // const tenants = result.sort((a, b) =>
  //   a.tenant_id! > b.tenant_id! ? 1 : a.tenant_id! < b.tenant_id! ? -1 : 0
  // );
  const history = useHistory();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const header = (
    <div className="tapis-ui__header">
      <div>
        {
          extension?.configuration?.logo?.url
          ? <img style={{height: "50px"}} src={extension?.configuration.logo.url} />
          : <img style={{height: "50px"}} src="./tapislogo.png" />
        }
        {extension?.configuration.logo?.logoText || "TapisUI"}
      </div>
      <div></div>
      <div>
        {
          claims['sub']
          && (extension !== undefined && extension.configuration.multiTenantFeatures)
          && (
            <ButtonDropdown
              size="sm"
              isOpen={isOpen}
              toggle={() => setIsOpen(!isOpen)}
              className="dropdown-button"
            >
              <DropdownToggle caret>{claims['sub']}</DropdownToggle>
              <DropdownMenu style={{ maxHeight: '50vh', overflowY: 'scroll' }}>
                <DropdownItem header>Tenants</DropdownItem>
                <DropdownItem divider />
                <QueryWrapper isLoading={isLoading} error={error}>
                  {tenants.map((tenant) => {
                    return (
                      <DropdownItem
                        onClick={() => {
                          window.location.href = tenant.base_url + '/tapis-ui/';
                        }}
                      >
                        {tenant.tenant_id}
                      </DropdownItem>
                    );
                  })}
                </QueryWrapper>
                <DropdownItem divider />
                <DropdownItem onClick={() => history.push('/logout')}>
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </ButtonDropdown>
          )
        }
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
      <div style={{ display: 'flex', flexGrow: 1, height: '100vh' }}>
        <PageLayout top={header} left={<Sidebar />} right={workbenchContent} />
      </div>
    </NotificationsProvider>
  );
};

export default Layout;
