export function parseError(validatorError) {  
    if ((typeof validatorError) == "string") {
        return validatorError; 
    }

    let output = "";  

    Object.keys(validatorError).forEach(function (item) {  
        output += "\n" + validatorError[item].message;  
    });  

    return output.substr(1, output.length);  
}  
