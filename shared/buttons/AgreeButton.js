import {Button} from "@rneui/themed";
import {View} from "react-native";
import {useNavigation} from '@react-navigation/native';
import globalStyles from "../styles/globalStyles";

const AgreeButton = ({text, handle}) => {
    const navigation = useNavigation();

    return (
        <View style={globalStyles.loginButtonSection}>
            <Button
                onPress={handle}
                title={text}
                titleStyle={{fontWeight: "bold", fontSize: 16, color: "white"}}
                buttonStyle={{
                    backgroundColor: "#AD4343",
                    borderRadius: 8,
                    paddingVertical: 5,
                }}
                containerStyle={{
                    width: "100%",
                    marginHorizontal: 50,
                    marginVertical: 10,
                }}
            />
        </View>
    );
};
export default AgreeButton;