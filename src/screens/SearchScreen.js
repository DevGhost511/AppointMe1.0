import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import CardMedium from "../components/CardMedium";
import SearchBar from "../components/SearchBar";
import { getDatabase, ref, child, get } from "firebase/database";
import Colors from "../utils/Colors";
import parseContentData from "../utils/ParseContentData";
import { filterServicesByCategory } from "../utils/CategoryUtils";
import categories from "../utils/Categories";
import Category from "../components/Category";

export default function SearchScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [serviceList, setServiceList] = useState([]);
    const [filteredServiceList, setFilteredServiceList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");

    useEffect(() => {
        const dbRef = ref(getDatabase());

        get(child(dbRef, "services"))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const serviceList = parseContentData(snapshot.val());
                    setServiceList(serviceList);
                    setFilteredServiceList(serviceList);
                } else {
                    console.log("No data available");
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setLoading(false); // Veriler çekildikten sonra yükleme durumunu kapat
            });
    }, []);

    const handleCategoryFilter = (category) => {
        const filteredList = filterServicesByCategory(category, serviceList);
        setSelectedCategory(category);
        setFilteredServiceList(filteredList);
    };

    //Read mock json
    const renderService = ({ item }) => (
        <CardMedium
            image_source={require("../../assets/user-profile.png")}
            service={item}
            onSelect={() => handleServiceSelect(item)}
        />
    );

    const handleServiceSelect = (item) => {
        navigation.navigate("ServiceDetailScreen", { item });
    };

    //Search function
    const handleSearch = (text) => {
        const searchedText = text.toLowerCase();

        const filteredList = serviceList.filter((service) => {
            const skillsMatch = service.skills.some((skill) =>
                skill.toLowerCase().includes(searchedText)
            );

            const expertAreaMatch = service.expert_area
                .toLowerCase()
                .includes(searchedText);

            return skillsMatch || expertAreaMatch;
        });

        setFilteredServiceList(filteredList);
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator
                    style={styles.loadingIndicator}
                    size="large"
                    color={Colors.color_blue}
                />
            ) : (
                <View>
                    <View style={styles.search_container}>
                        <SearchBar onSearch={handleSearch} />
                    </View>

                    <View  style={styles.category_container}>
                        <FlatList
                            horizontal
                            data={categories}
                            renderItem={({ item }) => (
                                <Category
                                    category={item}
                                    isSelected={selectedCategory === item}
                                    onPress={() => handleCategoryFilter(item)}
                                />
                            )}
                            keyExtractor={(item) => item}
                        />
                    </View>

                    <FlatList
                        data={filteredServiceList}
                        renderItem={renderService}
                        keyExtractor={(item) => item.id.toString()}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    search_container: {
        marginTop: 48,
        marginHorizontal: 24,
    },
    category_container: {
        marginHorizontal: 24,
    },
    loadingIndicator: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
