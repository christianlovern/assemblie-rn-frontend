import { Button } from '@rneui/themed';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import globalStyles from '../styles/globalStyles';
import { useData } from '../../context';

const InAppPrimary = ({ text, handle }) => {
	const navigation = useNavigation();

	const { organization } = useData();

	return (
		<View style={globalStyles.loginButtonSection}>
			<Button
				onPress={handle}
				title={text}
				titleStyle={{
					fontWeight: 'bold',
					fontSize: 16,
					color: 'white',
				}}
				buttonStyle={{
					backgroundColor: organization.primaryColor,
					borderRadius: 8,
					paddingVertical: 5,
					height: 50,
				}}
				containerStyle={{
					width: '50%',

					marginHorizontal: 50,
					marginVertical: 10,
				}}
			/>
		</View>
	);
};
export default InAppPrimary;
