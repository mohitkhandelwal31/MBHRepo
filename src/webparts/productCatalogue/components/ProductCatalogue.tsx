import * as React from 'react';
import styles from './ProductCatalogue.module.scss';
import type { IProductCatalogueProps } from './IProductCatalogueProps';
import { DocumentCard, DocumentCardDetails } from '@fluentui/react/lib/DocumentCard';
import { Modal } from '@fluentui/react/lib/Modal';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { TextField } from '@fluentui/react/lib/TextField';
// import { IconButton } from '@fluentui/react/lib/Button';
import spservices from '../../Services/spservices';
import InventoryForm from './InventoryForm';
import { PrimaryButton } from 'office-ui-fabric-react/lib/components/Button/PrimaryButton/PrimaryButton';

export interface IProductCatalogueState {
  lights: any[];
  inventoryItems: any[];
  showModal: boolean;
  selectedLight: any;
  selectedCategory: string;
  searchTerm: string;
  isSiteOwner: boolean;
}

// Combined category options for merged results
const lightCategoryOptions: IDropdownOption[] = [
  { key: 'All', text: 'All Categories' },
  { key: 'Hanging Light', text: 'Hanging Light' },
  { key: 'Wall Light', text: 'Wall Light' },
  { key: 'Chandelier', text: 'Chandelier' },
  { key: 'Elevation Light', text: 'Elevation Light' },
  { key: 'Mirror Light', text: 'Mirror Light' }
];

export default class ProductCatalogue extends React.Component<IProductCatalogueProps, IProductCatalogueState> {
  private spServices: spservices;
  private inventoryFormRef: React.RefObject<InventoryForm>;
  constructor(props: IProductCatalogueProps) {
    super(props);
    this.state = {
      lights: [],
      inventoryItems: [],
      showModal: false,
      selectedLight: null,
      selectedCategory: 'All',
      searchTerm: '',
      isSiteOwner: false
    };
    this.spServices = new spservices(props.context.pageContext);
    this.inventoryFormRef = React.createRef<InventoryForm>();
  }

  componentDidMount(): void {
    this.checkSiteOwnerGroup();
    this.getDataBasedOnLightType();
  }

  private checkSiteOwnerGroup = async (): Promise<void> => {
    try {
      const isSiteOwner = await this.spServices.isCurrentUserInOwnersGroup();
      this.setState({ isSiteOwner });
    } catch (error) {
      console.error('Error checking site owner group:', error);
    }
  }

  private refreshInventory = () => {
    this.getDataBasedOnLightType();
  }

  // private handleEditLight = (light: any, event: React.MouseEvent) => {
  //   event.stopPropagation(); // Prevent modal from opening
  //   if (this.inventoryFormRef.current) {
  //     this.inventoryFormRef.current.editLight(light);
  //   }
  // }

  private renderLightCard = (light: any) => {
    return (
      <DocumentCard key={light.Id} className={light.availableQuantity > 0 ? styles.lightCard : styles.lightCardOutOfStock}>
        <DocumentCardDetails>
          <div style={{ position: 'relative' }}>
            {/* <IconButton
              iconProps={{ iconName: 'Edit' }}
              title="Edit"
              ariaLabel="Edit"
             // onClick={(event) => this.handleEditLight(light, event)}
              styles={{
                root: {
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  zIndex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid #ccc'
                }
              }}
            /> */}
            <img src={light.ProductPicture?.Url} alt={light.ProductPicture?.Url} style={{ width: '100%', height: '200px', objectFit: 'fill' }} />
          </div>
          <div className={styles.titleContainer}>
            <div>{light.Title}</div>
          </div>
          <div className={styles.priceContainer}>
            <div className={styles.attribute}>Price</div>
            <div className={styles.attributeValue}>{light.Price?.toFixed(2)}</div>
          </div>
          {this.state.isSiteOwner && (
            <div className={styles.actualPriceContainer}>
              <div className={styles.attribute}>A.Price</div>
              <div className={styles.attributeValue}>{light.Actualprice?.toFixed(2)}</div>
            </div>
          )}
          <div className={styles.productContainer}>
            <div className={styles.attribute}>Product Code</div>
            <div className={styles.attributeValue}>{light.ProductCode}</div>
          </div>
          <div className={styles.colorContainer}>
            <div className={styles.attribute}>Color</div>
            <div className={styles.attributeValue}>{light.Color}</div>
          </div>
          <div className={styles.quantityContainer}>
            <div className={styles.attribute}>Quantity</div>
            <div className={styles.attributeValue}>{light.availableQuantity}</div>
          </div>
        </DocumentCardDetails>
      </DocumentCard>
    );
  }

  private getDataBasedOnLightType = async () => {
    try {
      // Fetch both decorative lights and lights in parallel
      const [decorativeLights, lights, inventoryItems] = await Promise.all([
        this.spServices.getDecorativeLightsItems(this.props.context),
        this.spServices.getLightsItems(this.props.context),
        this.spServices.getInventoryItems(this.props.context)
      ]);

      const soldQuantitiesByCode = inventoryItems.reduce((acc: Record<string, number>, item: any) => {
        const key = (item.ProductCode || '').toString().trim().toLowerCase();
        const quantity = Number(item.Quantity) || 0;
        if (key && quantity > 0) {
          acc[key] = (acc[key] || 0) + quantity;
        }
        return acc;
      }, {});

      const mergedLights: any[] = [
        ...decorativeLights.map(item => ({ ...item, sourceList: 'Decorative' })),
        ...lights.map(item => ({ ...item, sourceList: 'Lights' }))
      ].map(light => {
        const code = (light.ProductCode || '').toString().trim().toLowerCase();
        const soldQty = soldQuantitiesByCode[code] || 0;
        const availableQuantity = Math.max(0, (Number(light.Quantity) || 0) - soldQty);
        return {
          ...light,
          availableQuantity,
          originalQuantity: Number(light.Quantity) || 0
        };
      });

      this.setState({ lights: mergedLights, inventoryItems });
    } catch (error) {
      console.error("Error fetching merged lights items:", error);
    }
  }
  salesDashboardUrl = () => {
    window.open(this.props.salesDashboard, '_self');
  };


  public render(): React.ReactElement<IProductCatalogueProps> {
    const {
      hasTeamsContext,
    } = this.props;

    let filteredLights = []
    filteredLights = this.state.selectedCategory === 'All'
      ? this.state.lights
      : this.state.lights.filter(light => light.Category === this.state.selectedCategory);

    if (this.state.searchTerm && this.state.searchTerm.trim() !== '') {
      const searchLower = this.state.searchTerm.toLowerCase().trim();
      filteredLights = filteredLights.filter(light =>
        (light.Title && light.Title.toLowerCase().includes(searchLower)) ||
        (light.ProductCode && light.ProductCode.toLowerCase().includes(searchLower))
      );
    }

    const inStockLights = filteredLights.filter(light => light.availableQuantity > 0);
    const outOfStockLights = filteredLights.filter(light => light.availableQuantity === 0);
    const sortedLights = [...inStockLights, ...outOfStockLights];

    return (
      <section className={`${styles.productCatalogue} ${hasTeamsContext ? styles.teams : ''}`}>
        <InventoryForm
          ref={this.inventoryFormRef}
          context={this.props.context}
          onInventoryUpdated={this.refreshInventory}
          lights={this.state.lights}
        />
        <div className={styles.formActions}>
          <PrimaryButton
            text="Sales Dashboard"
            onClick={this.salesDashboardUrl}
            styles={{ root: { marginRight: 10 } }}
          />
        </div>
        <div className={styles.lightsList}>
          <div className={styles.Container}>
            <h3>Available Lights:</h3>
          </div>
          <div className={styles.dropdownContainer}>
            <Dropdown
              label="Select Category"
              selectedKey={this.state.selectedCategory}
              options={lightCategoryOptions}
              onChange={(event, option) => this.setState({ selectedCategory: option?.key as string })}
              styles={{ dropdown: { width: 300, borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }, label: { fontWeight: 600 } }}
            />
          </div>
          <div className={styles.searchContainer}>
            <TextField
              label="Search by Name or Product Code"
              value={this.state.searchTerm}
              onChange={(event, newValue) => this.setState({ searchTerm: newValue || '' })}
              styles={{ fieldGroup: { width: 300, borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } }}
              placeholder="Enter product name or code..."
            />
          </div>
          <div className={styles.lightsGrid}>
            {sortedLights.map(light => (
              <div key={`${light.sourceList}-${light.Id}`} onClick={() => this.setState({ selectedLight: light, showModal: true })}>
                {this.renderLightCard(light)}
              </div>
            ))}
          </div>
          <Modal
            isOpen={this.state.showModal}
            onDismiss={() => this.setState({ showModal: false })}
            isBlocking={false}
            isModeless={false}
          >
            {this.state.selectedLight && (
              <div className={styles.modalContainer}>
                <h2>{this.state.selectedLight.Title}</h2>
                <img src={this.state.selectedLight.ProductPicture?.Url} alt={this.state.selectedLight.Title} style={{ width: '100%', maxWidth: '500px' }} />
                {/* Assuming more images are in a field like Images */}
                {this.state.selectedLight.Images && this.state.selectedLight.Images.map((img: string, index: number) => (
                  <img key={index} src={img} alt={`${this.state.selectedLight.Title} ${index + 1}`} style={{ width: '100%', maxWidth: '200px', margin: '10px' }} />
                ))}
              </div>
            )}
          </Modal>
        </div>
      </section>
    );
  }
}
