import * as React from 'react';
import styles from './SalesDashboard.module.scss';
import { ISalesDashboardProps } from './ISalesDashboardProps';
import { escape } from '@microsoft/sp-lodash-subset';
import spservices from '../../Services/spservices';

interface ISalesSaleRecord {
  id: number;
  title: string;
  productCode: string;
  quantity: number;
  price: number;
  totalValue: number;
  soldDate: Date;
  soldDateLabel: string;
}

interface IGroupedMonth {
  month: string;
  totalQuantity: number;
  totalValue: number;
  records: ISalesSaleRecord[];
}

interface ISalesDashboardState {
  salesData: ISalesSaleRecord[];
  loading: boolean;
  error: string | null;
  groupByMonth: boolean;
}

export default class SalesDashboard extends React.Component<ISalesDashboardProps, ISalesDashboardState> {
  private spServices: spservices;

  constructor(props: ISalesDashboardProps) {
    super(props);

    this.state = {
      salesData: [],
      loading: true,
      error: null,
      groupByMonth: false
    };

    this.spServices = new spservices(props.context.pageContext);
  }

  public componentDidMount(): void {
    this.loadSalesData();
  }

  private loadSalesData = async (): Promise<void> => {
    this.setState({ loading: true, error: null });

    try {
      const inventoryItems = await this.spServices.getInventoryItems(this.props.context);
      const salesData: ISalesSaleRecord[] = inventoryItems.map((item: any) => {
        const soldDate = item.SaleDate ? new Date(item.SaleDate) : new Date(item.Created);
        const price = Number(item.Price) || 0;
        const quantity = Number(item.Quantity) || 0;
        const totalValue = price * quantity;
        return {
          id: Number(item.Id) || 0,
          title: item.Title || item.ProductCode || 'Unknown',
          productCode: item.ProductCode || '',
          quantity,
          price,
          totalValue,
          soldDate,
          soldDateLabel: soldDate.toLocaleDateString()
        };
      }).sort((a, b) => b.soldDate.getTime() - a.soldDate.getTime());

      this.setState({ salesData, loading: false });
    } catch (error) {
      console.error('Error fetching inventory sales data:', error);
      this.setState({ error: 'Unable to load sales data.', loading: false });
    }
  }

  private toggleGroupByMonth = (): void => {
    this.setState(prevState => ({ groupByMonth: !prevState.groupByMonth }));
  }

  private getMonthLabel(date: Date): string {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  private getMonthKey(date: Date): string {
    const month = date.getMonth() + 1;
    return `${date.getFullYear()}-${month < 10 ? '0' + month : month}`;
  }

  private renderSalesTable(): React.ReactNode {
    if (this.state.salesData.length === 0) {
      return <div className={styles.empty}>No sales records found.</div>;
    }

    return (
      <table className={styles.salesTable}>
        <thead>
          <tr>
            <th>Date Sold</th>
            <th>Product</th>
            <th>Product Code</th>
            <th>Quantity Sold</th>
            <th>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {this.state.salesData.map(record => (
            <tr key={`${record.id}-${record.productCode}-${record.soldDate.getTime()}`}>
              <td>{record.soldDateLabel}</td>
              <td>{escape(record.title)}</td>
              <td>{escape(record.productCode)}</td>
              <td>{record.quantity}</td>
              <td>${record.totalValue.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  private renderMonthTotals(): React.ReactNode {
    if (this.state.salesData.length === 0) {
      return <div className={styles.empty}>No sales records found.</div>;
    }

    const grouped = this.state.salesData.reduce((acc: Record<string, IGroupedMonth>, record) => {
      const key = this.getMonthKey(record.soldDate);
      if (!acc[key]) {
        acc[key] = {
          month: this.getMonthLabel(record.soldDate),
          totalQuantity: 0,
          totalValue: 0,
          records: []
        };
      }

      acc[key].totalQuantity += record.quantity;
      acc[key].totalValue += record.totalValue;
      acc[key].records.push(record);
      return acc;
    }, {} as Record<string, IGroupedMonth>);

    const months = Object.keys(grouped)
      .map(key => grouped[key])
      .sort((a: IGroupedMonth, b: IGroupedMonth) => new Date(b.month).getTime() - new Date(a.month).getTime());

    return (
      <table className={styles.salesTable}>
        <thead>
          <tr>
            <th>Month</th>
            <th>Total Quantity Sold</th>
            <th>Total Sales Value</th>
            <th>Number of Sales</th>
          </tr>
        </thead>
        <tbody>
          {months.map(month => (
            <tr key={month.month}>
              <td>{month.month}</td>
              <td>{month.totalQuantity}</td>
              <td>${month.totalValue.toFixed(2)}</td>
              <td>{month.records.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  private renderSalesSummary(): React.ReactNode {
    const totalQuantity = this.state.salesData.reduce((sum, record) => sum + record.quantity, 0);
    const totalValue = this.state.salesData.reduce((sum, record) => sum + record.totalValue, 0);

    return (
      <div className={styles.salesSummary}>
        <h4>Sales Summary</h4>
        <p>Total Quantity Sold: {totalQuantity}</p>
        <p>Total Sales Value: ${totalValue.toFixed(2)}</p>
      </div>
    );
  }

  public render(): React.ReactElement<ISalesDashboardProps> {
    const {
      hasTeamsContext,
    } = this.props;

    const { loading, error, groupByMonth } = this.state;

    return (
      <section className={`${styles.salesDashboard} ${hasTeamsContext ? styles.teams : ''}`}>

        <div className={styles.salesTablePanel}>
          <div className={styles.salesHeader}>
            <div>
              <h3>Inventory Sales</h3>
              <p>Review what sold by date and switch to month-wise totals.</p>
            </div>
            <button className={styles.salesButton} onClick={this.toggleGroupByMonth}>
              {groupByMonth ? 'Show date-wise sales' : 'Show month-wise totals'}
            </button>
          </div>

          {error && <div className={styles.errorText}>{error}</div>}
          {loading ? <div className={styles.empty}>Loading sales data...</div> : (
            <>
              {groupByMonth ? this.renderMonthTotals() : this.renderSalesTable()}
              {groupByMonth ? this.renderSalesSummary() : null}
            </>
          )}
        </div>
      </section>
    );
  }
}
