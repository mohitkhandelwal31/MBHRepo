import * as React from 'react';
import styles from './GalleryView.module.scss';



interface IGalleryViewProps {
    lights: any[];  
}

export default class GalleryView extends React.Component<IGalleryViewProps> {
  public render(): React.ReactElement {
    const { lights = [] } = this.props;

    return (
      <div className={styles.galleryView}>
        {lights.length === 0 ? (
          <div className={styles.emptyState}>No lights available.</div>
        ) : (
          <div className={styles.galleryGrid}>
            {lights.map((light) => {
              const imageUrl = light.ProductPicture?.Url || light.ProductPicture || '';

              return (
                <div key={`${light.sourceList || 'light'}-${light.Id}`} className={styles.galleryItem}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={light.Title || 'Light image'} className={styles.galleryImage} />
                  ) : (
                    <div className={styles.imagePlaceholder}>No image</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}