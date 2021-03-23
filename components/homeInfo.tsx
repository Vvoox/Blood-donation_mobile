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

export default function HomeInfo({ path }: { path: string }) {


  // const fetchUser = (type: any) => {
  //   console.log(type);
  //   getAllUsersByType(type).then(r => setUser(r.data));
  //
  // }

  return (
    <View>

      <View style={styles.helpContainer}>
        <TouchableOpacity onPress={handleHelpPress} style={styles.helpLink}>
          <Text style={styles.helpLinkText} lightColor={Colors.light.tint}>
            Set this Options
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

function handleHelpPress() {
  WebBrowser.openBrowserAsync(
    'github.com/Vvoox'
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
