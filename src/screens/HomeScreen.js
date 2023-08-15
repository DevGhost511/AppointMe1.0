import { getAuth } from "firebase/auth";
import React from "react";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
    View,
    Button,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../styles/Theme";
import SearchBar from "../components/SearchBar";
import { child, get, getDatabase, ref } from "firebase/database";
import parseContentData from "../utils/ParseContentData";
import CardAppointmentSmall from "../components/CardAppointmentSmall";
import { sortAppointmentsByDateAndTime } from "../utils/CalendarUtils";
import categories from "../utils/Categories";
import { CardCarousel } from "../components/CardCarousel";

const userInfo = {
    id: 0,
    firstName: "Zehra",
    lastName: "Güneş",
    district: "Ataşehir",
};

export default function HomeScreen({ navigation }) {

    const [appointmentList, setAppointmentList] = useState([]);

    const [userAuth, setUserAuth] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const auth = getAuth();
    const user = auth.currentUser;

    // //Kullanıcı oturumu
    useEffect(() => {
        auth.onAuthStateChanged((userAuth) => {
            setUserAuth(!!userAuth);
        });
    }, []);

    //randevu listesi getirme
    useEffect(() => {
        if (userAuth) {
            const dbRef = ref(getDatabase());

            get(child(dbRef, "userAppointments/" + user.uid))
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const getList = parseContentData(snapshot.val());

                        const servicePromises = getList.map((appointment) =>
                            fetchServiceInfo(appointment.serviceId)
                        );

                        // Tüm promise'ların sonuçlarını bekle
                        Promise.all(servicePromises)
                            // Randevu verilerine sağlayıcı bilgilerini ekle
                            .then((serviceInfos) => {
                                const updateAppointmentList = getList.map(
                                    (appointment, index) => ({
                                        ...appointment,
                                        serviceInfo: serviceInfos[index],
                                    })
                                );
                                // Tarih ve saatine göre sıralanmış randevu listesini güncelle
                                setAppointmentList(
                                    sortAppointmentsByDateAndTime(
                                        updateAppointmentList
                                    )
                                );

                                setIsReady(true);
                            });
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {});
        } else {
            setAppointmentList([]);
            setTimeout(() => {
                setIsReady(true);
            }, 2000);
        }
    }, [userAuth]); // User auth dependecy

    function fetchServiceInfo(id) {
        const dbRef = ref(getDatabase(), "services/" + id);

        return get(dbRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    // console.log(snapshot.val())
                    return snapshot.val();
                } else {
                    return null;
                }
            })
            .catch(() => {
                console.error(error);
                return null;
            });
    }

    //NAVIGATION
    function goToCalendar() {
        navigation.navigate("CalendarScreen");
    }

    //NAVIGATION
    function goToNotifications() {
        navigation.navigate("NotificationsScreen");
    }

    const handleSearch = () => {
        nav.navigate("SearchScreen");
    };

    return (
        <ScrollView>
            {isReady && (
                <View style={styles.container}>
                    <View style={styles.top_container}>
                        <View style={styles.header_container}>
                            <Text style={styles.header_text}>AppointMe</Text>
                            <Feather
                                name="bell"
                                size={24}
                                style={styles.icon}
                                onPress={goToNotifications}
                            />
                        </View>
                        <View style={styles.card_container}>
                            <View style={styles.welcome_container}>
                                <Text style={styles.welcome_text}>
                                    Hoşgeldin
                                </Text>
                                <Text style={styles.welcome_text_bold}>
                                    {user ? ", " + userInfo.firstName : ""}
                                </Text>
                            </View>
                            <Text style={styles.detail_text}>
                                Bir hizmet mi arıyorsun?
                            </Text>
                            <View style={styles.search_container}>
                                <SearchBar
                                    placeholder_text={"Hizmet Ara"}
                                    onSearch={handleSearch}
                                />
                            </View>
                        </View>
                    </View>
                    <View style={styles.app_container}>
                        <Text style={styles.text}>Sizin İçin</Text>
                        <View>
                            <CardCarousel list={categories} />
                        </View>

                        {appointmentList.length === 0 ? (
                            ""
                        ) : (
                            <View>
                                <Text style={styles.text}>
                                    Yaklaşan Randevular
                                </Text>
                                <View style={styles.list_container}>
                                    {appointmentList
                                        .slice(0, 2)
                                        .map((appointment) => (
                                            <CardAppointmentSmall
                                                appointment={appointment}
                                                serviceInfo={
                                                    appointment.serviceInfo
                                                }
                                                key={appointment.id}
                                                onPress={goToCalendar}
                                            />
                                        ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            )}
            {!isReady && (
                <View style={styles.loading_container}>
                    <ActivityIndicator size="large" color={colors.color_blue} />
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 48,
    },
    top_container: {
        paddingHorizontal: 24,
    },
    card_container: {
        marginVertical: 16,
        backgroundColor: colors.color_blue,
        borderRadius: 20,
        padding: 16,
    },
    header_container: {
        marginVertical: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    welcome_container: {
        marginTop: 48,
        flexDirection: "row",
        alignItems: "center",
    },
    search_container: {
        flex: 1,
        paddingBottom: 16,
    },
    app_container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    list_container: {
        flex: 1,
        marginVertical: 8,
    },
    header_text: {
        fontSize: 34,
        fontFamily: "Mulish-Medium",
        color: colors.color_blue,
        flex: 1,
    },
    welcome_text: {
        paddingHorizontal: 8,
        fontSize: 24,
        color: colors.color_white,
        fontFamily: "Mulish-Medium",
    },
    text: {
        flex: 1,
        fontSize: 18,
        fontFamily: "Mulish-Medium",
    },
    detail_text: {
        flex: 1,
        flexWrap: "wrap",
        fontSize: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        color: colors.color_white,
        fontFamily: "Mulish-Medium",
    },
    welcome_text_bold: {
        color: colors.color_white,
        fontSize: 24,
        fontFamily: "Mulish-Bold",
    },
    icon: {
        color: colors.color_blue,
    },
    loading_container: {
        flex: 1,
        alignContent: "center",
        justifyContent: "center",
    },
});
