import * as React from 'react';
import styles from './Inventory.module.scss';
import { IInventoryProps } from './IInventoryProps';
import { Modal } from '@fluentui/react/lib/Modal';
import spservices from '../../Services/spservices';

export interface IInventoryState {
  inventoryDetails: any[];
  loading: boolean;
  error?: string;
  showImageModal: boolean;
  selectedProductImageUrl?: string;
  selectedProductTitle?: string;
  showHistoryModal: boolean;
  selectedHistoryProduct?: any;
  isSiteOwner: boolean;
}

export default class Inventory extends React.Component<IInventoryProps, IInventoryState> {
  private spServices: spservices;

  constructor(props: IInventoryProps) {
    super(props);

    this.state = {
      inventoryDetails: [],
      loading: true,
      error: undefined,
      showImageModal: false,
      selectedProductImageUrl: undefined,
      selectedProductTitle: undefined,
      showHistoryModal: false,
      selectedHistoryProduct: undefined,
      isSiteOwner: false
    };

    this.spServices = new spservices(props.context.pageContext);
  }
  private checkSiteOwnerGroup = async (): Promise<void> => {
    try {
      const isSiteOwner = await this.spServices.isCurrentUserInOwnersGroup();
      this.setState({ isSiteOwner });
    } catch (error) {
      console.error('Error checking site owner group:', error);
    }
  }

  public componentDidMount(): void {
    this.checkSiteOwnerGroup();
    this.loadInventoryDetails();
  }

  private openImageModal = (item: any): void => {
    if (!item?.imageUrl) {
      return;
    }

    this.setState({
      showImageModal: true,
      selectedProductImageUrl: item.imageUrl,
      selectedProductTitle: item.title
    });
  };

  private closeImageModal = (): void => {
    this.setState({
      showImageModal: false,
      selectedProductImageUrl: undefined,
      selectedProductTitle: undefined
    });
  };

  private openHistoryModal = (item: any): void => {
    this.setState({
      showHistoryModal: true,
      selectedHistoryProduct: item
    });
  };

  private closeHistoryModal = (): void => {
    this.setState({
      showHistoryModal: false,
      selectedHistoryProduct: undefined
    });
  };

  private loadInventoryDetails = async (): Promise<void> => {
    try {
      const [decorativeLights, lights, inventoryItems] = await Promise.all([
        this.spServices.getDecorativeLightsItems(this.props.context),
        this.spServices.getLightsItems(this.props.context),
        this.spServices.getInventoryItems(this.props.context)
      ]);

      const products = [
        ...decorativeLights.map((item: any) => ({ ...item, sourceList: 'Decorative' })),
        ...lights.map((item: any) => ({ ...item, sourceList: 'Lights' }))
      ];

      const inventoryImpactByCode = inventoryItems.reduce((acc: Record<string, { added: number; sold: number }>, item: any) => {
        const code = (item.ProductCode || '').toString().trim().toLowerCase();
        const quantity = Number(item.Quantity) || 0;
        if (!code || quantity === 0) {
          return acc;
        }

        const eventType = (item.Event || 'Added').toString().trim().toLowerCase();
        if (!acc[code]) {
          acc[code] = { added: 0, sold: 0 };
        }

        if (eventType === 'sold') {
          acc[code].sold += quantity;
        } else {
          acc[code].added += quantity;
        }

        return acc;
      }, {});

      const historyByCode = inventoryItems.reduce((acc: Record<string, any[]>, item: any) => {
        const code = (item.ProductCode || '').toString().trim().toLowerCase();
        if (!code) {
          return acc;
        }

        const quantity = Number(item.Quantity) || 0;
        const title = item.Title || item.ProductCode || 'Inventory entry';
        const eventType = item.Event || 'Added';

        if (!acc[code]) {
          acc[code] = [];
        }

        acc[code].push({
          id: item.Id,
          title,
          quantity: Math.abs(quantity),
          event: eventType,
          created: item.Created ? new Date(item.Created) : undefined,
          raw: item
        });

        return acc;
      }, {});

      const productMap = products.reduce((acc: Record<string, any>, product: any) => {
        const code = (product.ProductCode || '').toString().trim().toLowerCase();
        const title = product.Title || product.ProductCode || 'Unknown';
        if (!code) {
          return acc;
        }

        const originalQuantity = Number(product.Quantity) || 0;
        const imageUrl =
          product.ProductPicture?.Url ||
          product.ProductPicture?.ServerRelativeUrl ||
          product.ProductPicture?.serverRelativeUrl ||
          product.Image?.Url ||
          product.Image?.ServerRelativeUrl ||
          product.Image?.serverRelativeUrl ||
          '';

        if (!acc[code]) {
          acc[code] = {
            productCode: product.ProductCode,
            title,
            category: product.Category || product.sourceList || 'Unknown',
            sourceList: product.sourceList,
            originalQuantity,
            soldQuantity: 0,
            remainingQuantity: originalQuantity,
            imageUrl,
            history: historyByCode[code] || []
          };
        } else {
          acc[code].originalQuantity += originalQuantity;
          acc[code].remainingQuantity += originalQuantity;
          if (!acc[code].imageUrl && imageUrl) {
            acc[code].imageUrl = imageUrl;
          }
        }

        return acc;
      }, {});

      const inventoryDetails = Object.keys(productMap).map(code => {
        const item = productMap[code];
        const addedQuantity = inventoryImpactByCode[code]?.added || 0;
        const soldQuantity = inventoryImpactByCode[code]?.sold || 0;
        const currentStock = Math.max(0, item.originalQuantity + addedQuantity);
        const remainingQuantity = Math.max(0, currentStock - soldQuantity);

        const lastEventType = item.history && item.history.length > 0
          ? item.history[item.history.length - 1].event
          : 'Added';

        return {
          ...item,
          addedQuantity,
          soldQuantity,
          currentStock,
          remainingQuantity,
          lastEventType
        };
      });

      this.setState({ inventoryDetails, loading: false });
    } catch (error) {
      console.error('Error loading inventory details:', error);
      this.setState({ error: 'Unable to load inventory details.', loading: false });
    }
  };

  public render(): React.ReactElement<IInventoryProps> {
    const {

      hasTeamsContext,
    } = this.props;

    const { inventoryDetails, loading, error, showImageModal, selectedProductImageUrl, selectedProductTitle, showHistoryModal, selectedHistoryProduct } = this.state;

    const totalDistinctProducts = inventoryDetails.length;
    const totalSold = inventoryDetails.reduce((sum, item) => sum + (item.soldQuantity || 0), 0);
    const totalRemaining = inventoryDetails.reduce((sum, item) => sum + (item.remainingQuantity || 0), 0);
    const remainingProducts = inventoryDetails.filter(item => item.remainingQuantity > 0).length;

    return (
      <section className={`${styles.inventory} ${hasTeamsContext ? styles.teams : ''}`}>
        <div className={styles.inventorySummary}>
          <h3>Inventory Sold / Remaining Detail</h3>
          {loading ? (
            <p>Loading inventory details...</p>
          ) : error ? (
            <p className={styles.errorText}>{error}</p>
          ) : (
            <>
              <div className={styles.summaryRow}>
                <div className={styles.summaryItem}>Total products: {totalDistinctProducts}</div>
                <div className={styles.summaryItem}>Products with stock remaining: {remainingProducts}</div>
                <div className={styles.summaryItem}>Total remaining quantity: {totalRemaining}</div>
                <div className={styles.summaryItem}>Total sold quantity: {totalSold}</div>
              </div>
              <table className={styles.inventoryTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Code</th>
                    <th>Category</th>
                    <th className={styles.numberCell}>Stock</th>
                    <th className={styles.numberCell}>Sold</th>
                    <th className={styles.numberCell}>Remaining</th>
                    {this.state.isSiteOwner ? <th>More details</th> : ""}
                  </tr>
                </thead>
                <tbody>
                  {inventoryDetails.map(item => (
                    <tr key={`${item.productCode}-${item.sourceList}`}>
                      <td>
                        {item.imageUrl ? (
                          <button
                            type="button"
                            className={styles.productLink}
                            onClick={() => this.openImageModal(item)}
                          >
                            {item.title}
                          </button>
                        ) : (
                          item.title
                        )}
                      </td>
                      <td>{item.productCode}</td>
                      <td>{item.category}</td>
                      <td className={styles.numberCell}>{item.currentStock !== undefined ? item.currentStock : item.originalQuantity}</td>
                      <td className={styles.numberCell}>{item.soldQuantity}</td>
                      <td className={styles.numberCell}>{item.remainingQuantity}</td>
                      {this.state.isSiteOwner ? <td>
                        <button
                          type="button"
                          className={styles.detailsButton}
                          onClick={() => this.openHistoryModal(item)}
                        >
                          View history
                        </button>
                      </td> : ""}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        <Modal
          isOpen={showImageModal}
          onDismiss={this.closeImageModal}
          isBlocking={false}
        >
          <div className={styles.modalContent}>
            <h3>{selectedProductTitle}</h3>
            {selectedProductImageUrl ? (
              <img src={selectedProductImageUrl} alt={selectedProductTitle} className={styles.modalImage} />
            ) : (
              <p>No image available.</p>
            )}
          </div>
        </Modal>
        <Modal
          isOpen={showHistoryModal}
          onDismiss={this.closeHistoryModal}
          isBlocking={false}
        >
          <div className={styles.historyModal}>
            <h3>History for {selectedHistoryProduct?.title}</h3>
            {selectedHistoryProduct?.history?.length ? (
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Quantity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHistoryProduct.history.map((entry: any) => (
                    <tr key={entry.id || `${entry.event}-${entry.created?.getTime()}`}>
                      <td>{entry.created ? entry.created.toLocaleString() : 'Unknown'}</td>
                      <td>{entry.event}</td>
                      <td className={styles.numberCell}>{entry.quantity}</td>
                      <td>{entry.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No history entries found.</p>
            )}
          </div>
        </Modal>
      </section>
    );
  }
}
