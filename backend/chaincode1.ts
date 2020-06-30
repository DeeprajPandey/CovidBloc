class Ctof extends Contract{

    public async getMedProfile(ctx: Context, medID:string){
        const cid = new ClientIdentity(ctx.stub);
        const userID = cid.getID(); 
        const medKey= "m" + medID;
        const medObj = readAsset(ctx,medKey);
        if(medObj!=null && medObj.email==userID){
            return medObj;
        }
        else{
            return null;
        }
    }

    public async validatePatient(ctx: Context, medID:string, checkID:string){
        const medKey = "m" + medID;
        const medObj= readAsset(ctx,medKey);
        if(medObj!=null){
            for (let i = 1; i <= medObj.approvalCtr; i++) {
                const assetKey= key+":"+i.toString();
                const approvalObj = readAsset(ctx,assetKey);
                if(approvalObj!=null && approvalObj.approvalID==checkID && approvalObj.patientID==null){
                    return "Validate Patient Successful";
                }
            }
            return "ApprovalID is invalid"; 
        }

        else{
            return "MedID is invalid";
        }
    }

    public async getKeys(ctx:Context){
        const allResults= [];
        const key = "meta";
        const metaObj = readAsset(ctx,key);
        for (let i=1;i<=metaObj.num_positives;i++){
            const patientKey = "p"+i.toString();
            const patientObj = readAsset(ctx,patientKey);
            if(patientObj!=null){
                allResults.push({patientKey, patientObj});  //if key also needs to sent
            }
        }
        return JSON.stringify(allResults);
    }


}