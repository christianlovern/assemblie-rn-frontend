import {Button} from "@rneui/themed";
import {View} from "react-native";
import {useNavigation} from '@react-navigation/native';
import globalStyles from "../styles/globalStyles";
import { useData } from "../../context";

const CancelButton = ({text, setModalVisible, modalVisible}) => {
    const navigation = useNavigation();
    const {organization} = useData()

    return (
        <View style={globalStyles.loginButtonSection}>
            <Button
                onPress={() => setModalVisible(!modalVisible)}
                title={text}
                type="outline"
                titleStyle={{fontWeight: "bold", fontSize: 16, color: organization.primaryColor}}
                buttonStyle={{
                    backgroundColor: "white",
                    borderRadius: 8,
                    paddingVertical: 5,
                    borderWidth: 2,
                    borderColor: organization.primaryColor,
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
export default CancelButton;