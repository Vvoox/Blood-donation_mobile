import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BloodTypeBadge from '../components/BloodTypeBadge';
import DonorCard from '../components/DonorCard';
import { Colors } from '../constants/Colors';
import { getGiversByBloodTypes, getAllGivers } from '../services/giver-service';
import { Giver } from '../models/giver';
import { SearchStackParamList } from '../types';

type SearchScreenNavigationProp = StackNavigationProp<SearchStackParamList, 'SearchMain'>;

interface Props {
  navigation: SearchScreenNavigationProp;
  route: any;
}

const BLOOD_TYPES = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

export default function SearchScreen({ navigation, route }: Props) {
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const [city, setCity] = React.useState('');
  const [results, setResults] = React.useState<Giver[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  React.useEffect(() => {
    // Handle pre-filter from home screen
    const prefilterType = route?.params?.prefilterType;
    if (prefilterType) {
      setSelectedTypes([prefilterType]);
      handleSearch([prefilterType], '');
    }
  }, []);

  const toggleBloodType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSearch = async (types?: string[], cityFilter?: string) => {
    const typesToSearch = types !== undefined ? types : selectedTypes;
    const cityToSearch = cityFilter !== undefined ? cityFilter : city;

    setLoading(true);
    setHasSearched(true);

    try {
      let data: Giver[];
      if (typesToSearch.length > 0) {
        data = await getGiversByBloodTypes(typesToSearch);
      } else {
        data = await getAllGivers();
      }

      if (cityToSearch.trim()) {
        data = data.filter((g) =>
          g.user?.city?.toLowerCase().includes(cityToSearch.toLowerCase())
        );
      }

      setResults(data);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setCity('');
    setResults([]);
    setHasSearched(false);
  };

  const renderHeader = () => (
    <View>
      {/* Blood type selector */}
      <Text style={styles.filterLabel}>Blood Type</Text>
      <View style={styles.bloodTypeGrid}>
        {BLOOD_TYPES.map((type) => (
          <BloodTypeBadge
            key={type}
            bloodType={type}
            size="medium"
            selected={selectedTypes.includes(type)}
            onPress={() => toggleBloodType(type)}
          />
        ))}
      </View>

      {/* City filter */}
      <Text style={styles.filterLabel}>City</Text>
      <View style={styles.cityInputWrapper}>
        <Ionicons name="location-outline" size={20} color={Colors.TextSecondary} style={styles.cityIcon} />
        <TextInput
          style={styles.cityInput}
          placeholder="Filter by city..."
          placeholderTextColor={Colors.TextSecondary}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />
        {city.length > 0 && (
          <TouchableOpacity onPress={() => setCity('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={Colors.TextSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search / Clear buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => handleSearch()}
          activeOpacity={0.85}>
          <Ionicons name="search" size={18} color={Colors.White} />
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
        {hasSearched && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearFilters}
            activeOpacity={0.85}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasSearched && !loading && (
        <Text style={styles.resultsCount}>
          {results.length} donor{results.length !== 1 ? 's' : ''} found
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={Colors.Primary} />
          <Text style={styles.loadingText}>Searching donors...</Text>
        </View>
      );
    }
    if (!hasSearched) {
      return (
        <View style={styles.centeredContainer}>
          <Ionicons name="search-outline" size={64} color={Colors.TextSecondary} />
          <Text style={styles.emptyTitle}>Find Blood Donors</Text>
          <Text style={styles.emptySubtitle}>
            Select blood types and/or enter a city, then tap Search.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="people-outline" size={64} color={Colors.TextSecondary} />
        <Text style={styles.emptyTitle}>No donors found</Text>
        <Text style={styles.emptySubtitle}>Try different blood types or city.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Ionicons name="search" size={24} color={Colors.White} />
            <Text style={styles.headerTitle}>Find Donors</Text>
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={loading ? [] : results}
        keyExtractor={(item) => item.giverId || Math.random().toString()}
        renderItem={({ item }) => (
          <DonorCard
            donor={item}
            onPress={() => navigation.navigate('DonorDetail', { donor: item })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  header: {
    backgroundColor: Colors.Primary,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.White,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TextPrimary,
    marginBottom: 10,
    marginTop: 4,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cityInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.White,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  cityIcon: {
    marginRight: 8,
  },
  cityInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: Colors.TextPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchButton: {
    flex: 1,
    backgroundColor: Colors.Primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.Primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  searchButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '700',
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.TextSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: Colors.TextSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 13,
    color: Colors.TextSecondary,
    marginBottom: 8,
  },
  centeredContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    color: Colors.TextSecondary,
    fontSize: 15,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TextPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.TextSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
