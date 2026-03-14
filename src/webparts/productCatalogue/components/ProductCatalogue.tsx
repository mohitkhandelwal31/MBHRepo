import * as React from 'react';
import styles from './ProductCatalogue.module.scss';
import type { IProductCatalogueProps } from './IProductCatalogueProps';
import spservices from '../../Services/spservices';
import { DocumentCard, DocumentCardDetails } from '@fluentui/react/lib/DocumentCard';

export interface IProductCatalogueState {
  lights: any[];
}

export default class ProductCatalogue extends React.Component<IProductCatalogueProps, IProductCatalogueState> {
  private spServices: spservices;

  constructor(props: IProductCatalogueProps) {
    super(props);
    this.state = {
      lights: []
    };
    this.spServices = new spservices(props.context.pageContext);
  }

  componentDidMount(): void {
    this.spServices.getDecorativeLightsItems(this.props.context)
      .then(items => {
        console.log("Decorative lights items:", items);
        this.setState({ lights: items });
      })
      .catch(error => {
        console.error("Error fetching decorative lights items:", error);
      });
  }

  public render(): React.ReactElement<IProductCatalogueProps> {
    const {
      hasTeamsContext,
    } = this.props;


    return (
      <section className={`${styles.productCatalogue} ${hasTeamsContext ? styles.teams : ''}`}>
        <div className={styles.lightsList}>
          <h3>Available  Lights:</h3>
          <div className={styles.lightsGrid}>
            {this.state.lights.map(light => (
              <DocumentCard key={light.Id} className={styles.lightCard}>
                <DocumentCardDetails>
                  <img src={light.ProductPicture?.Url} alt={light.ProductPicture?.Url} style={{ width: '100%', height: '200px', objectFit: 'fill' }} />
                  <div className={styles.titleContainer}>
                    <div>{light.Title}</div>
                  </div>
                  <div className={styles.priceContainer}>
                    <div className={styles.attribute}>Price</div>
                    <div className={styles.attributeValue}>{light.Price?.toFixed(2)}</div>
                  </div>
                  <div className={styles.productContainer}>
                    <div className={styles.attribute}>Product Code</div>
                    <div className={styles.attributeValue}>{light.ProductCode}</div>
                  </div>
                  <div className={styles.quantityContainer}>
                    <div className={styles.attribute}>Quantity</div>
                    <div className={styles.attributeValue}>{light.Quantity}</div>
                  </div>
                </DocumentCardDetails>
              </DocumentCard>
            ))}
          </div>
        </div>
      </section>
    );
  }
}
