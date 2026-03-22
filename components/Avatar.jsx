import { View, Text, Image } from "react-native";

export default function Avatar({

 uri,
 name,
 size = 42,

 style // 👈 accept style prop

}){

 const baseStyle = {

  width:size,
  height:size,

  borderRadius:size/2

 };

 if(uri){

  return(

   <Image

    source={{ uri }}

    style={[baseStyle, style]} // 👈 merge styles

   />

  );

 }


 return(

  <View

   style={[

    baseStyle,

    {

     backgroundColor:"#0A84FF",

     justifyContent:"center",

     alignItems:"center"

    },

    style // 👈 merge styles

   ]}

  >

   <Text

    style={{

     color:"#fff",

     fontWeight:"600",

     fontSize:size/2.2

    }}

   >

    {name?.charAt(0)?.toUpperCase()}

   </Text>

  </View>

 );

}