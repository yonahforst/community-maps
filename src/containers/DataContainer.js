import React from 'react';

import {
  ImageManipulator
} from 'expo'

import urlToBlob from '../lib/urlToBlob'

import { 
  db, 
  storage,
} from '../lib/firebase'

import FB from 'firebase'

const { firestore: { GeoPoint } } = FB

const DataContext = React.createContext({
  items: {},
  messages: [],
  loading: false,
  error: null,
});

const geoPointToObj = geopoint => ({
  longitude: geopoint.longitude,
  latitude: geopoint.latitude,
})

export default class DataContainer extends React.Component {
  state = {
    items: {},
    messages: [],
    loading: false,
    error: null,
  }

  componentDidMount() {
    this.firebaseUnsubscribe = db.collection('items')
    .orderBy('at', 'desc')
    .onSnapshot(querySnapshot => {

      var items = {};
      querySnapshot.forEach(doc => {
        const data = doc.data()

        items[doc.id] = {
          ...data,
          coordinates: geoPointToObj(data.coordinates)
        }
      })
      
      this.setState({
          items: {
          ...this.state.items,
          ...items,
        }
      })
    })
  }

  componentWillUnmount() {
    this.firebaseUnsubscribe && this.firebaseUnsubscribe()
  }


  addNewItem = async ({ emoji, coordinates, picture }) => {
    const {
      auth
    } = this.props

    try {
      this.setState({ 
        loading: true,
      })
      
      const {
        uri,
      } = picture

      const {
        longitude,
        latitude,
      } = coordinates

      const filename = uri.substring(uri.lastIndexOf('/') + 1)

      const ref = storage.ref().child(filename)
      const blob = await urlToBlob(uri)

      const uploadTask = await ref.put(blob)
      const pictureUri = await uploadTask.ref.getDownloadURL()
      const { base64 } = await ImageManipulator.manipulateAsync(uri, [{ 
        resize: {
          width: 25,
        }
      }], {
        compress: 0,
        base64: true
      })

      await db.collection('items').add({
        emoji,
        pictureUri,
        at: Date.now(),
        picturePreview: base64,
        coordinates: new GeoPoint(latitude, longitude),
        userId: auth.currentUser.uid,
        likes: 1,
        dislikes: 0,
      })
  
      this.setState({
        error: null,
        loading: false,
      })
    } catch (error) {
      console.log(error)
      this.setState({
        error,
        loading: false,
      })
    }
  }

  setLikes = (id, likes) => {
    db.collection('items').doc(id).update({
      likes
    })
  }

  setDislikes = (id, dislikes) => {
    db.collection('items').doc(id).update({
      dislikes
    })
  }

  setChatRoom = (id) => {
    if (this.chatUnsubscribe) this.chatUnsubscribe()

    this.setState({
      messages: []
    })

    if (!id) return

    this.chatUnsubscribe = db.collection('rooms')
    .doc(id)
    .collection('messages')
    .orderBy('at', 'asc')
    .onSnapshot(querySnapshot => {

      var messages = [];
      querySnapshot.forEach(doc => {
        messages.push(doc.data())
      })
      
      this.setState({
        messages
      })
    })
  }

  sendMessage = async (id, body) => {
    const { 
      auth 
    } = this.props

    await db.collection('rooms')
    .doc(id)
    .collection('messages')
    .add({
      body,
      userId: auth.currentUser.uid,
      displayName: auth.currentUser.displayName,
      at: Date.now(),
    })
  }


  render() {
    return (
      <DataContext.Provider value={{ 
        ...this.state,
        setLikes: this.setLikes,
        setDislikes: this.setDislikes,
        addNewItem: this.addNewItem,
        setChatRoom: this.setChatRoom,
        sendMessage: this.sendMessage,
      }}> 
        { this.props.children }
      </DataContext.Provider>
    );
  }
}

export const DataContainerHoc = (Component) => props => (
  <DataContext.Consumer>
    { context => <Component { ...context }  { ...props } /> }
  </DataContext.Consumer>
)
