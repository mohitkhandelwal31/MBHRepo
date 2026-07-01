import * as React from 'react';
// import styles from './AdminDashboard.module.scss';
import { IAdminDashboardProps } from './IAdminDashboardProps';

import { PrimaryButton } from 'office-ui-fabric-react';

export default class AdminDashboard extends React.Component<IAdminDashboardProps, {}> {

  navigateUrl = (navigateURL: string) => {
    window.open(navigateURL, '_self');
  };

  public render(): React.ReactElement<IAdminDashboardProps> {
    const {

    } = this.props;

    return (
      <div>
        <div>
          <PrimaryButton
            text="Admin Dashboard"
            onClick={() => this.navigateUrl(this.props.inventoryList)}
            styles={{ root: { marginRight: 10 } }}
          />
        </div>
        <div>
          <PrimaryButton
            text="Admin Dashboard"
            onClick={() => this.navigateUrl(this.props.adminDashboard)}
            styles={{ root: { marginRight: 10 } }}
          />
        </div>

      </div>
    );
  }
}
