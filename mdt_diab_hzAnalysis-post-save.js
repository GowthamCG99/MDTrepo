var logFile = new java.io.FileWriter("./logs/main/mdt_diab_hzAnalysis-post-save.log", false); 
var logWriter = new java.io.BufferedWriter(logFile);
var currentDateTime = new java.util.Date().toString();
var projectID = workItem.getProjectId();
var workItemID = workItem.getId();
var linkedworkitem = workItem.getLinkedWorkItems();
var linkeditems = workItem.getLinkedWorkItemsStructsDirect();
var hsflag=false;
logWriter.write(currentDateTime + "\tWorkitem: " + workItem + "\n");

// If there is no link to hazardous situation then the below fields should be null//
for(i=0;i<linkeditems.length;i++)
	{	
		if(linkeditems[i].getLinkRole().getId()=="relates")
		{   
			hsflag=true;
		}
		
	}
if(!hsflag)
{
	workItem.setCustomField("hazardCause",null);
	workItem.setCustomField("hazardId",null);
	workItem.setCustomField("hazardousSituation",null);
	workItem.setCustomField("hazardDesc",null);
	workItem.setCustomField("hazardCategoryCode",null);
}
function riskAccept(residualRisk)
{
    if(residualRisk == "Zone 1")
        return "yes";
    else if(residualRisk == "Zone 2" || residualRisk == "Zone 3")
        return "no";
    else
        return "";
}

function newSHA(question)
{
    if(question=="yes"){
        if(workItem.getValue("check")){
        var project = trackerService.getTrackerProject(workItem.getProjectId());
		var newSHAWorkItem = project.createWorkItem("mdt_diab_hzAnalysis");
		newSHAWorkItem.setTitle("New "+workItem.getTitle());
		var description = new com.polarion.core.util.types.Text("text/html", "new hazard analysis item was introduced as a result of the RCM");
		newSHAWorkItem.setDescription(description);
		var role = project.getWorkItemLinkRoleEnum().wrapOption("parent");
		newSHAWorkItem.addLinkedItem(workItem, role, null, false);
		newSHAWorkItem.save();
        workItem.setValue("check",false);
        logWriter.write(currentDateTime + "\tcheck yes Message: " + workItem.getValue("check") + "\n");
        workItem.setCustomField("hold",newSHAWorkItem.getId());
        workItem.save();
        return "See "+newSHAWorkItem.getId();
        }else{
            return workItem.getCustomField("associated");
        }
        
    }else{
        workItem.setValue("check",true);
        for(i=0;i<linkedworkitem.length;i++)
        {
            logWriter.write(currentDateTime + "\t WI: " + linkedworkitem[i].getId() + "\n");
            if(linkedworkitem[i].getId().equals(workItem.getCustomField("hold")))
            {
                logWriter.write(currentDateTime + "\t WI: " + linkedworkitem[i] + "\n");
                var project = trackerService.getTrackerProject(workItem.getProjectId());
                var role = project.getWorkItemLinkRoleEnum().wrapOption("parent");
                logWriter.write(currentDateTime + "\t WI: " + role + "\n");
                linkedworkitem[i].removeLinkedItem(workItem,role);
                linkedworkitem[i].save();
            }
        }
        workItem.save();
        if(question=="no")
            return "N/A";
        else
            return "";
    }
}

// Pre Mitigation Qualitative values are configured here	
//prob - Probability of Occurrence of Harm, sev - Severity, zone - Risk Level

function getZ(wItem){
	var zones = "";

	if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'qualitative')
	{
		if(wItem.getCustomField("prob"))
			var prob = wItem.getCustomField("prob").getId();
		if(wItem.getCustomField("sev"))
			var sev = wItem.getCustomField("sev").getId();

		if((prob == "frequent" && (sev == "negligible" || sev == "minor")) || (prob == "common" && (sev == "minor" || sev == "major")) || (prob == "occasional" && (sev == "major" || sev == "critical")) || (prob == "remote" && (sev == "critical" || sev == "catastrophic")) || (prob == "improbable" && sev == "catastrophic"))
			zones = "Zone 2";
		else if((prob == "frequent" && (sev == "major" || sev == "critical" || sev == "catastrophic")) || (prob == "common" && (sev == "critical" || sev == "catastrophic")) || (prob == "occasional" && sev == "catastrophic"))
			zones = "Zone 3";
		else if((prob == "common" && sev == "negligible") || (prob == "occasional" && (sev == "negligible" || sev == "minor")) || (prob == "remote" && (sev == "negligible" || sev == "minor" || sev == "major")) || (prob == "improbable" && (sev == "negligible" || sev == "minor" || sev == "major" || sev == "critical")))
			zones = "Zone 1";
		else
			zones = "N/A";
	}
	else
	{
		wItem.setEnumerationValue("prob","na");
		wItem.setEnumerationValue("sev","na");
		zones = "N/A";
	}
	return zones;
}

//Pre Mitigation Quantitative values are configured here
/*p1Num - Total related complaint count, p1Den - Devices put into service or the affected population count, harmSev - Count of reported Harm (Severity), p1Rate - Probability of a hazardous situation occurring (P1)
p2Rate - Probability of the hazardous situation leading to harm, pRate - Probability of occurrence of harm (Ph), sev1 - Severity, zone1 - Risk Level*/			
		
function getP1(wItem){
	var p1rate = "";
	var perc = 100;
	var Num = "";
	var Den = "";

	if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'quantitative')
	{
		if( wItem.getCustomField("p1Num") != null )
		{
			Num = wItem.getCustomField("p1Num");
		}

		if( wItem.getCustomField("p1Den") != null )
		{
			Den = wItem.getCustomField("p1Den");
		}
			p1rate = ((new java.lang.Double(Num))/new java.lang.Double(Den) * new java.lang.Double(perc)).toFixed(8) ;
	}
		
	if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'qualitative')
	{
		wItem.setCustomField("p1Num",null);
		wItem.setCustomField("p1Den",null);
	}
	return p1rate;
}

function getP2(wItem){
	var p2rate = "";
	var Num = "";
	var perc = 100;
	var sev = "";

	if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'quantitative')
	{
		if(wItem.getCustomField("p1Num") != null )
		{
			Num = wItem.getCustomField("p1Num");
		}
		if(wItem.getCustomField("harmSev") != null )
		{
			sev = wItem.getCustomField("harmSev");
		}
		p2rate = ((new java.lang.Double(sev))/(new java.lang.Double(Num))*new java.lang.Double(perc)).toFixed(8);
	}	
	if(wItem.getCustomField("riskEstimate").getId() == 'qualitative')
	{
		wItem.setCustomField("harmSev",null);
	} 	
	return p2rate;		
}

function getPR(p1rate,p2rate){
	var prate = "";
	var perc = 100;
	if(p1rate!=""&&p2rate!="")
		prate = ((new java.lang.Double(p1rate))* (new java.lang.Double(p2rate))/(new java.lang.Double(perc))).toFixed(8);

	return prate;
}

function getZ1(wItem){
	var zones1 = "";

	if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'quantitative')
	{  
		if(wItem.getCustomField("prob"))
		var sev1 = wItem.getCustomField("sev1").getId();

		if((prate>=0.0001 && (sev1 == "negligible" || sev1 == "minor")) || ((prate>=0.00001 &&prate<0.0001) && (sev1 == "minor" || sev1 == "major")) || ((prate>=0.000001 &&prate<0.00001) && (sev1 == "major" || sev1 == "critical")) || ((prate>=0.0000001 &&prate<0.000001) && (sev1 == "critical" || sev1 == "catastrophic")) || ((prate>=0.00000001 &&prate<0.0000001) && sev1 == "catastrophic"))
			zones1 = "Zone 2";
		else if((prate>=0.0001 && (sev1 == "major" || sev1 == "critical" || sev1 == "catastrophic")) || ((prate>=0.00001 &&prate<0.0001) && (sev1 == "critical" || sev1 == "catastrophic")) || ((prate>=0.000001 &&prate<0.00001) && sev1 == "catastrophic"))
			zones1 = "Zone 3";
		else if(((prate>=0.00001 &&prate<0.0001) && sev1 == "negligible") || ((prate>=0.000001 &&prate<0.00001) && (sev1 == "negligible" || sev1 == "minor")) || ((prate>=0.0000001 &&prate<0.000001) && (sev1 == "negligible" || sev1 == "minor" || sev1 == "major")) || ((prate>=0.00000001 &&prate<0.0000001) && (sev1 == "negligible" || sev1 == "minor" || sev1 == "major" || sev1 == "critical")))
			zones1 = "Zone 1";
		else
			zones1 = "N/A";
	}
	else
	{
		wItem.setEnumerationValue("sev1","na");
		zones1 = "N/A";
	}
	return zones1;
}

//Post Mitigation Qualitative values are configured here
//prob1 - Post Reduction Probability of Occurrence of Harm, sev2 - Post Reduction Severity, zone2 - Residual Risk Level		
		
function getZ2(wItem){
	var zones2 = "";

	if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'qualitative')
	{ 
		if(wItem.getCustomField("prob1"))
			var prob1 = wItem.getCustomField("prob1").getId();
		if(wItem.getCustomField("sev2"))
			var sev2 = wItem.getCustomField("sev2").getId();

		if((prob1 == "frequent" && (sev2 == "negligible" || sev2 == "minor")) || (prob1 == "common" && (sev2 == "minor" || sev2 == "major")) || (prob1 == "occasional" && (sev2 == "major" || sev2 == "critical")) || (prob1 == "remote" && (sev2 == "critical" || sev2 == "catastrophic")) || (prob1 == "improbable" && sev2 == "catastrophic"))
			zones2 = "Zone 2";
		else if((prob1 == "frequent" && (sev2 == "major" || sev2 == "critical" || sev2 == "catastrophic")) || (prob1 == "common" && (sev2 == "critical" || sev2 == "catastrophic")) || (prob1 == "occasional" && sev2 == "catastrophic"))
			zones2 = "Zone 3";
		else if((prob1 == "common" && sev2 == "negligible") || (prob1 == "occasional" && (sev2 == "negligible" || sev2 == "minor")) || (prob1 == "remote" && (sev2 == "negligible" || sev2 == "minor" || sev2 == "major")) || (prob1 == "improbable" && (sev2 == "negligible" || sev2 == "minor" || sev2 == "major" || sev2 == "critical")))
			zones2 = "Zone 1";
		else
			zones2 = "N/A";
	}
	else
	{
		wItem.setEnumerationValue("prob1","na");
		wItem.setEnumerationValue("sev2","na");
		zones2 = "N/A";
	}
	return zones2;
}

//Post Mitigation Quantitative values are configured here
/*p1Num1 - Total related complaint count, p1Den1 - Devices put into service or the affected population count, harmSev1 - Count of reported Harm (Severity), p1Rate1 - Post Reduction Probability of a hazardous situation occurring (P1)
p2Rate1 - Post Reduction Probability of the hazardous situation leading to harm, pRate1 - Post Reduction Probability of occurrence of harm (Ph), sev3 - Post Reduction Severity, zone3 - Residual Risk Level*/	

function getP11(wItem){
	var p1rate1 = "";
	var perc = 100;
	var Num1 = "";
	var Den1 = "";

	if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'quantitative')
	{
		if( wItem.getCustomField("p1Num1") != null )
		{
			Num1 = wItem.getCustomField("p1Num1");
}


if( wItem.getCustomField("p1Den1") != null )
{
	Den1 = wItem.getCustomField("p1Den1");
}

	p1rate1 = ((new java.lang.Double(Num1))/new java.lang.Double(Den1) * new java.lang.Double(perc)).toFixed(8) ;
}
if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'qualitative')
{
	wItem.setCustomField("p1Num1",null);
	wItem.setCustomField("p1Den1",null);
}
return p1rate1;
}
function getP21(wItem){
var p2rate1 = "";
var Num1 = "";
var perc = 100;
var sev11 = "";


if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'quantitative')
{
if( wItem.getCustomField("p1Num1") != null )
{
	Num1 = wItem.getCustomField("p1Num1");
}
if( wItem.getCustomField("harmSev1") != null ){
	sev11 = wItem.getCustomField("harmSev1");
}
		p2rate1 = ((new java.lang.Double(sev11))/(new java.lang.Double(Num1))*new java.lang.Double(perc)).toFixed(8);
}
if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'qualitative')
{
	wItem.setCustomField("harmSev1",null);
}    	
return p2rate1;	
	
}
function getPR1(p1rate1,p2rate1){

var prate1 = "";
var perc = 100;
if(p1rate1!=""&&p2rate1!="")
	prate1 = ((new java.lang.Double(p1rate1))* (new java.lang.Double(p2rate1))/(new java.lang.Double(perc))).toFixed(8);

return prate1;
}
function getZ3(wItem){
var zones3 = "";

if(wItem.getCustomField("riskEstimate")!=null && wItem.getCustomField("riskEstimate").getId() == 'quantitative')
{
	if(wItem.getCustomField("sev3"))
	var sev3 = wItem.getCustomField("sev3").getId();

	if((prate1>=0.0001 && (sev3 == "negligible" || sev3 == "minor")) || ((prate1>=0.00001 &&prate1<0.0001) && (sev3 == "minor" || sev3 == "major")) || ((prate1>=0.000001 &&prate1<0.00001) && (sev3 == "major" || sev3 == "critical")) || ((prate1>=0.0000001 &&prate1<0.000001) && (sev3 == "critical" || sev3 == "catastrophic")) || ((prate1>=0.00000001 &&prate1<0.0000001) && sev3 == "catastrophic"))
		zones3 = "Zone 2";
	else if((prate1>=0.0001 && (sev3 == "major" || sev3 == "critical" || sev3 == "catastrophic")) || ((prate1>=0.00001 &&prate1<0.0001) && (sev3 == "critical" || sev3 == "catastrophic")) || ((prate1>=0.000001 &&prate1<0.00001) && sev3 == "catastrophic"))
		zones3 = "Zone 3";
	else if(((prate1>=0.00001 &&prate1<0.0001) && sev3 == "negligible") || ((prate1>=0.000001 &&prate1<0.00001) && (sev3 == "negligible" || sev3 == "minor")) || ((prate1>=0.0000001 &&prate1<0.000001) && (sev3 == "negligible" || sev3 == "minor" || sev3 == "major")) || ((prate1>=0.00000001 &&prate1<0.0000001) && (sev3 == "negligible" || sev3 == "minor" || sev3 == "major" || sev3 == "critical")))
		zones3 = "Zone 1";
	else
		zones3 = "N/A";
}
else
{
	wItem.setEnumerationValue("sev3","na");
	zones3 = "N/A";
}
return zones3;
}


try {
	//New SHA
	if(workItem.getCustomField("riskControl")!=null){
		workItem.setCustomField("associated",newSHA(workItem.getCustomField("riskControl").getId()));
	}else{
		workItem.setCustomField("associated",newSHA(""));
	}
			
	//For Pre Mitigation Qualitative Estimate			
	var zones = getZ(workItem);
	workItem.setCustomField("zone",zones);

	//For Pre Mitigation Quantitative Estimate
			
	var p1rate = getP1(workItem);
		if(p1rate=="")
			workItem.setCustomField("p1Rate","N/A");
		else 
			workItem.setCustomField("p1Rate",p1rate.toString() +"%");
	var p2rate = getP2(workItem);
		if(p2rate=="")
			workItem.setCustomField("p2Rate","N/A");
		else
			workItem.setCustomField("p2Rate",p2rate.toString() + "%");
	var prate = getPR(p1rate,p2rate);
		if(prate=="")
			workItem.setCustomField("pRate","N/A");
		else
			workItem.setCustomField("pRate",prate.toString() + "%");
	var zones1 = getZ1(workItem);
	workItem.setCustomField("zone1",zones1);
	

//For Post Mitigation Qualitative Estimate			   
	var zones2 = getZ2(workItem);
	workItem.setCustomField("zone2",zones2);
	
	//set riskAcceptable 
    workItem.setEnumerationValue("residualriskAcceptability",riskAccept(zones2));
	
	//For Post Mitigation Quantitative Estimate	
	var p1rate1 = getP11(workItem);
	if(p1rate1=="")
		workItem.setCustomField("p1Rate1","N/A");
	else 
		workItem.setCustomField("p1Rate1",p1rate1.toString() +"%");
	var p2rate1 = getP21(workItem);
	if(p2rate1=="")
		workItem.setCustomField("p2Rate1","N/A");
	else
		workItem.setCustomField("p2Rate1",p2rate1.toString() + "%");
	var prate1 = getPR1(p1rate1,p2rate1);
	if(prate1=="")
		workItem.setCustomField("pRate1","N/A");
	else
		workItem.setCustomField("pRate1",prate1.toString() + "%");
	var zones3 = getZ3(workItem);
	workItem.setCustomField("zone3",zones3);
	
	
	workItem.save();
} 
catch (runtimeException) 
{
	logWriter.write(currentDateTime + "\tRuntime Exception Occured: " + runtimeException + "\n");
}
logWriter.flush();

