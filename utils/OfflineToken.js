import { AsyncStorage } from 'react-native';

export async function removeOldToken () {
    try {
        let tokenid = await AsyncStorage.getItem('@tokenid');

        if (tokenid !== null) {
            //Token is NOT null, this means a previous user on this device logged out while offline.
            //We must safely revoke their token.
            console.log("There was a tokenid stored in memory, this means user logged out while offline. We need to deactivate their token by tokenid.");
            console.log("Removing", tokenid);

            //POST to our token API
            fetch("https://beep.nussman.us/api/auth/token", {
                method: "POST",
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "tokenid": tokenid })
            })
            .then(
                function(response) {
                    if (response.status !== 200) {
                        console.log('[OfflineToken.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                        return;
                    }
                    response.json().then(
                        function(data) {
                            //Hopefully the token was revoked server-side
                            //This API's ouput is not important, just log it
                            //so we know that this function is still working when needed
                            console.log("[OfflineToken.js] [API] Token Revoker API Responce: ", data);
                            if (data.status == "success") {
                                AsyncStorage.removeItem("@tokenid");
                            }
                        }
                    )
                }
            )
            .catch((error) => {
                 console.log("[OfflineToken.js] [API] Error fetching from the Beep (Token) API: ", error);
            });
        }
    }
    catch (error) {
        //If we reach this, we could not pull nessisary data from AsyncStorage
        console.log("[OfflineToken.js] [AsyncStorage] ", error);
    }
}
