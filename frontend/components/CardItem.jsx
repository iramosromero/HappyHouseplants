/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/forbid-prop-types */
import React from 'react';
import {
  Alert,
  Image,
  ViewPropTypes,
  View,
} from 'react-native';
import { PropTypes } from 'prop-types';
import {
  Button, Card, Icon, Layout, Text,
} from '@ui-kitten/components';
import AddMyPlantDialog from './AddMyPlantDialog';
import { SERVER_ADDR } from '../server';

const { authFetch } = require('../auth');

class CardItem extends React.Component {
  constructor(props) {
    super(props);
    const { styles } = props;

    if (styles.image === undefined) {
      styles.image = CardItem.defaultProps.styles.image;
    }
    if (styles.cardFooter === undefined) {
      styles.cardFooter = CardItem.defaultProps.styles.cardFooter;
    }
    if (styles.button === undefined) {
      styles.button = CardItem.defaultProps.styles.button;
    }
    if (styles.card === undefined) {
      styles.card = CardItem.defaultProps.styles.card;
    }

    this.state = {
      saved: undefined,
      owned: undefined,
      showAddDialog: false,
    };

    this.startChangePicture = this.startChangePicture.bind(this);
    this.toggleOwned = this.toggleOwned.bind(this);
    this.toggleSaveEntry = this.toggleSaveEntry.bind(this);
  }

  componentDidMount() {
    const { plant } = this.props;
    const itemThis = this;
    authFetch(`${SERVER_ADDR}/savedplants`)
      .then((savedPlantIDs) => {
        itemThis.setState({ saved: savedPlantIDs.find((cur) => cur.plantID === plant.plantID) });
      }).catch((error) => {
        console.error(`Failed to determine save status of plant ID ${plant.plantID} due to an error: ${error}.`);
      });

    authFetch(`${SERVER_ADDR}/myplants`)
      .then((myPlantIDs) => {
        itemThis.setState({
          owned: myPlantIDs.filter((cur) => cur.plantID === plant.plantID).length,
        });
      }).catch((error) => {
        console.error(`Failed to determine ownership status of plant ID ${plant.plantID} due to an error: ${error}.`);
      });
  }

  startChangePicture() {
    const { plant } = this.props;
    // TODO: Implement
    console.log(`Changing the picture for plant ID ${plant.plantID}...`);
  }

  toggleSaveEntry() {
    const { saved } = this.state;
    const { plant, onRemoveFromFavorites } = this.props;
    if (!saved) {
      authFetch(`${SERVER_ADDR}/savedplants`, 'POST', {
        plantID: plant.plantID,
        plantName: plant.plantName,
        image: plant.image,
      }).then(() => {
        this.setState({
          saved: true,
        });
      }).catch((error) => {
        Alert.alert(
          'Network Error',
          'Failed to save this plant',
          [
            { text: 'OK' },
          ],
        );
        console.error(`Failed to save a plant due to an error: ${error}`);
      });
    } else {
      authFetch(`${SERVER_ADDR}/savedplants`, 'DELETE', {
        plantID: plant.plantID,
      }).then(() => {
        this.setState({
          saved: false,
        });
        if (onRemoveFromFavorites) {
          onRemoveFromFavorites(plant);
        }
      }).catch((error) => {
        Alert.alert(
          'Network Error',
          'Failed to remove this plant',
          [
            { text: 'OK' },
          ],
        );
        console.error(`Failed to remove a plant due to an error: ${error}`);
      });
    }
  }

  toggleOwned() {
    const { owned } = this.state;
    const { plant, onRemoveFromOwned } = this.props;
    const idProp = '_id';
    if (!owned || onRemoveFromOwned === undefined) {
      this.setState({ showAddDialog: true });
    } else {
      authFetch(`${SERVER_ADDR}/myplants`, 'DELETE', {
        [idProp]: plant[idProp],
      }).then(() => {
        this.setState({
          owned: owned - 1,
        });
        onRemoveFromOwned(plant);
      }).catch((error) => {
        Alert.alert(
          'Network Error',
          'Failed to remove this plant',
          [
            { text: 'OK' },
          ],
        );
        console.error(`Failed to remove a plant due to an error: ${error}`);
      });
    }
  }

  render() {
    const {
      plant,
      styles,
      onPressItem,
      allowChangePicture,
      onRemoveFromOwned,
    } = this.props;
    const { saved, owned, showAddDialog } = this.state;

    const saveIcon = (info) => (
      <Icon {...info} name={saved ? 'heart' : 'heart-outline'} />
    );

    const collectionIcon = (info) => (
      <Icon {...info} name={onRemoveFromOwned === undefined ? 'plus-outline' : 'trash-outline'} />
    );

    const cameraIcon = (info) => (
      <Icon {...info} name="camera-outline" />
    );

    const renderItemHeader = (headerProps, info) => (
      <Layout {...headerProps}>
        <Text category="h6">
          {info}
        </Text>
      </Layout>
    );

    const cameraButton = allowChangePicture ? (
      <Button
        style={styles.button}
        status="primary"
        appearance="outline"
        accessoryLeft={cameraIcon}
        onPress={this.startChangePicture}
      />
    ) : undefined;

    const renderItemFooter = (footerProps) => (
      <Layout
        {...footerProps}
        style={styles.cardFooter}
      >
        <Button
          style={styles.button}
          status="primary"
          appearance={saved ? 'filled' : 'outline'}
          accessoryLeft={saveIcon}
          onPress={this.toggleSaveEntry}
        />
        <Button
          style={styles.button}
          status="primary"
          appearance={(owned && onRemoveFromOwned === undefined) ? 'filled' : 'outline'}
          accessoryLeft={collectionIcon}
          onPress={this.toggleOwned}
        />
        {cameraButton}
      </Layout>
    );

    return (
      <View>
        <AddMyPlantDialog
          visible={showAddDialog}
          plant={plant}
          plantName={plant.plantName}
          plantID={plant.plantID}
          onSubmit={() => this.setState({ showAddDialog: false })}
          onCancel={() => this.setState({ showAddDialog: false })}
        />
        <Card
          key={plant.plantID}
          style={styles.card}
          status="success"
          header={(headerProps) => renderItemHeader(headerProps, plant.plantName)}
          footer={renderItemFooter}
          onPress={() => { onPressItem(plant); }}
        >
          <Image
            source={{ uri: plant.image.sourceURL }}
            style={styles.image}
          />
        </Card>
      </View>
    );
  }
}

CardItem.propTypes = {
  plant: PropTypes.object.isRequired,
  onPressItem: PropTypes.func.isRequired,
  onRemoveFromOwned: PropTypes.func,
  onRemoveFromFavorites: PropTypes.func,
  allowChangePicture: PropTypes.bool,
  styles: PropTypes.objectOf(ViewPropTypes.style),
};

CardItem.defaultProps = {
  styles: {
    card: {
      marginVertical: 10,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    button: {
      margin: 3,
      width: 1,
      height: 3,
      flex: 0.5,
    },
    image: {
      height: 300,
    },
  },
  onRemoveFromOwned: undefined,
  onRemoveFromFavorites: undefined,
  allowChangePicture: false,
};

export default CardItem;
