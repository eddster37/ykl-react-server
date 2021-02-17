exports.isEmpty = (result, error = null) =>{
    if(result !== undefined && result !== null && result !== '' && !error){
        return false;
    }
    return true;
}