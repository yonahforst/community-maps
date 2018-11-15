import React from 'react';
import { 
  Button,
} from 'react-native';

import { createStackNavigator } from 'react-navigation';

import AuthContainer from './containers/AuthContainer'
import DataContainer from './containers/DataContainer'
import PushContainer from './containers/PushContainer'

import MapScreen from './containers/MapScreen'
import ItemScreen from './containers/ItemScreen'
import AddTimescren from './containers/AddItemScreen'

const noop = () => {}

const Navigator = createStackNavigator({
  MapScreen: {
    screen: MapScreen,
    navigationOptions: {
      header: null,
    }
  },
  ItemScreen: {
    screen: ItemScreen,
  },
  AddItemScreen: {
    screen: AddTimescren,
    navigationOptions: ({ navigation }) => ({
      headerRight: (
        <Button
          disabled={!navigation.getParam('canSave')}
          onPress={navigation.getParam('onSave') || noop}
          title="Save"
        />
      ),
    })
  },
}, {
  initialRouteName: 'MapScreen',
});

export default () => (
  <AuthContainer>
    <DataContainer>
      <PushContainer>
        <Navigator />
      </PushContainer>
    </DataContainer>
  </AuthContainer>
)