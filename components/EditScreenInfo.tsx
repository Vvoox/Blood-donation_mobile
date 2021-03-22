import * as WebBrowser from 'expo-web-browser';
import React, {useEffect, useState} from 'react';
import {Alert, TouchableOpacity} from 'react-native';
import { Searchbar } from 'react-native-paper';

import Colors from '../constants/Colors';
import { MonoText } from './StyledText';
import { Text, View } from './Themed';
import {fetchGivers, getAllUsers, getAllUsersByType} from "../services/giver-service";
import { SearchBar } from 'react-native-elements';
import {FlatList, SafeAreaView, StyleSheet, Image} from "react-native";
// import {createStackNavigator} from "@react-navigation/stack";
import {Container, Header, Content, Card, CardItem, Icon, Right, Thumbnail, Body} from 'native-base';
// import { Table, Row, Rows } from 'react-native-table-component';
import {
  ActionSheet,
  Button,
  Form,
  Input,
  Item,
  Label,
  Left,
  List,
  ListItem,
  Picker,
  Subtitle,
  Title
} from "native-base";
// import {Div} from "react-native-magnus";
import {Giver} from "../models/giver";
import {User} from "../models/user";
// import {connect, Provider} from 'react-redux';

export default function EditScreenInfo({ path }: { path: string }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [user, setUser] = useState([]);
  const onChangeSearch = (query: React.SetStateAction<string>) => {
    setSearchQuery(query);
    console.log(query);
    getAllUsersByType(query).then(r => setUser(r.data));

    // console.log(query);
  }

  // useEffect(() => {
  //   // getAllUsers().then(r => setUser(r.data));
  //   console.log(user);
  //   // getAllUsersByType(type).then(r => setUser(r.data));
  //
  // }, []);

  const fetchUser = (type: any) => {
    console.log(type);
    getAllUsersByType(type).then(r => setUser(r.data));

  }

  const goUser = (user: any) => {
    console.log(user.id);
    // getAllUsers().then(r => setUser(r.data));
    // Alert.alert(
    //     "This is user with id : "+user.id,
    //     "user "+user.firstName+" "+user.lastName,
    //     [
    //       {
    //         text: "Cancel",
    //         onPress: () => console.log("Cancel Pressed"),
    //         style: "cancel"
    //       },
    //       { text: "OK", onPress: () => console.log("OK Pressed") }
    //     ]
    // );
  }


  return (
    <View>
      <View style={styles.getStartedContainer}>

        <Searchbar
            placeholder="Type Blood"
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchBar}

        />
        {/*<Div style={{height: 20}}/>*/}
        {/*{giver && giver.length === 0 && <Text style={{textAlign: 'center'}}>*/}
        {/*  no giver yet.*/}
        {/*</Text>}*/}

        {/*<Text*/}
        {/*    style={styles.helpContainer}*/}
        {/*    lightColor="rgba(0,0,0,0.8)"*/}
        {/*    darkColor="rgba(255,255,255,0.8)">*/}
        {/*  Welcome to the Blood Donation App, here you can give and ask people for blood donation*/}
        {/*</Text>*/}
      </View>

      <View style={styles.helpContainer}>
        <TouchableOpacity onPress={handleHelpPress} style={styles.helpLink}>
          <Text style={styles.helpLinkText} lightColor={Colors.light.tint}>
            Tap here if your app doesn't automatically update after making changes
          </Text>
        </TouchableOpacity>

      </View>
      <List>
        {user && user.map((user: User, key: any) =>
        <ListItem button >
          <Left>
            <Body>
              {/*<Text >khalil</Text>*/}
              <Text >{user.firstName}</Text>
              <Text >{user.lastName}</Text>
            </Body>
          </Left>
          <Right>
            <Icon name="arrow-forward" onPress={() => goUser(user)} />
          </Right>
        </ListItem>
        )}
      </List>
    </View>
  );
}

function handleHelpPress() {
  WebBrowser.openBrowserAsync(
    'https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet'
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  developmentModeText: {
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  searchBar: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    textAlign: 'center',
  },
});
