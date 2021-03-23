import * as WebBrowser from 'expo-web-browser';
import React, {useEffect, useState} from 'react';
import {Alert, TouchableOpacity} from 'react-native';
import { Searchbar } from 'react-native-paper';

import Colors from '../constants/Colors';
import { MonoText } from './StyledText';
import { Text, View } from './Themed';
import {fetchGivers, getAllUsers, getAllUsersByType, getAllUsersByTypes} from "../services/giver-service";
import { SearchBar } from 'react-native-elements';
import {FlatList, SafeAreaView, StyleSheet, Image} from "react-native";
// import {createStackNavigator} from "@react-navigation/stack";
import {Container, Header, Content, Card, CardItem, Right, Thumbnail, Body} from 'native-base';
// import { Table, Row, Rows } from 'react-native-table-component';
import DropDownPicker from 'react-native-dropdown-picker';
import Icon from 'react-native-vector-icons/Fontisto';
import { Button } from 'react-native-elements';
// import Icon from 'react-native-vector-icons/dist/FontAwesome';

import {
  ActionSheet,

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
  const [selectedValue, setSelectedValue] = useState("java");
  const [blood, setBlood] = useState([]);

  const onChangeSearch = (query: React.SetStateAction<string>) => {
    setSearchQuery(query);
    console.log(query);
    getAllUsersByType(query).then(r => setUser(r.data));

    // console.log(query);
  }

  // useEffect(() => {
  //   getAllUsers().then(r => setUser(r.data));
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
    Alert.alert(
        "This is user with id : "+user.id,
        "user "+user.firstName+" "+user.lastName,
        [
          {
            text: "Cancel",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel"
          },
          { text: "OK", onPress: () => console.log("OK Pressed") }
        ]
    );
  }
  const onChangeBlood= (item: string) => {
    console.log(item);
    // @ts-ignore
    setBlood(item);
  }
  const goSearch = () => {
    console.log(blood);
    getAllUsersByTypes(blood).then(r => {
      console.log(r.data);
      setUser(r.data);
    });
  }



  return (
    <View>
      <DropDownPicker
          items={[
            {label: 'O+', value: 'O_POSITIVE', icon: () => <Icon name="blood-drop" size={18} color="#900" />},
            {label: 'O-', value: 'O_NEGATIVE', icon: () => <Icon name="blood-drop" size={18} color="#900" />},
            {label: 'A+', value: 'A_POSITIVE', icon: () => <Icon name="blood-drop" size={18} color="#900" />},
            // {label: 'A-', value: 'A_NEGATIVE', icon: () => <Icon name="blood-drop" size={18} color="#900" />},
            {label: 'B+', value: 'B_POSITIVE', icon: () => <Icon name="blood-drop" size={18} color="#900" />},
            // {label: 'B-', value: 'B_NEGATIVE', icon: () => <Icon name="blood-drop" size={18} color="#900" />},
            // {label: 'AB+', value: 'AB_POSITIVE', icon: () => <Icon name="blood-drop" size={18} color="#900" />},
            // {label: 'AB-', value: 'AB_NEGATIVE', icon: () => <Icon name="blood-drop" size={18} color="#900" />},
          ]}

          multiple={true}
          multipleText="%d types have been selected."
          min={0}
          max={10}

          placeholder={'Select a type'}
          defaultValue={''}
          containerStyle={{height: 40}}
          itemStyle={{justifyContent: 'flex-start'}}
          onChangeItem={item=>onChangeBlood(item)}
      />
      <View style={styles.getStartedContainer}>
        <Button
            title="Search"
            onPress={goSearch}
            icon={
              <Icon
                  name="search"
                  size={15}
                  color="white"
              />
            }
        />

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
            <Icon name="check" onPress={() => goUser(user)} />
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
    paddingTop:10
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
