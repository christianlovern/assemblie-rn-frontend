/**
 * This is for a button at the top right-hand corner of the header which, when clicked,
 * will display a modal that allows users to exit the application.
 *
 */

import React, {useState} from "react";
import {Pressable, View} from "react-native";
import Icon from "react-native-vector-icons/Octicons";
import globalStyles from "../styles/globalStyles.js";
import GlobalModal from "../modals/GlobalModal.js";
import { globalText } from "../text/global.js";

const SignOutButton = () => {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <View>
            <GlobalModal
                Title={globalText.exitTitle}
                paragraph={globalText.exitParagraph}
                btn1={globalText.exitBtn1}
                btn2={globalText.exitBtn2}
                setModalVisible={setModalVisible}
                modalVisible={modalVisible}
            ></GlobalModal>
            {/* Right Side Header Button */}
            <Pressable style={({pressed}) => [pressed ? {opacity: 0.6} : {},
            ]} onPress={() => setModalVisible(true)}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        alignContent: "center",
                        alignSelf: "center",
                    }}
                >
                    <Icon
                        name="sign-out"
                        size={25}
                        marginTop={3.5}
                        color={globalStyles.colorPallet.textWhite}
                    />
                </View>
            </Pressable>
        </View>
    );
};

export default SignOutButton;