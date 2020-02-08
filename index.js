const contractSource = `
contract Event =
  record eventH ={
    id:int,
    name:string,
    description:string,
    createdAt:int,
    updatedAt:int,
    event_date:int,
    created_by:address,
    price:int,
    purchased:bool}
    
  record state ={
      index_counter:int,
      events:map(int,eventH)}
      
  entrypoint init()={
    index_counter=0,
    events={}}
    
  entrypoint getEventLength():int=
    state.index_counter
    
  stateful entrypoint add_event(_name:string,_description:string,_date:int, _price:int) =
   let stored_event = {id=getEventLength() + 1,name=_name,description=_description, createdAt=Chain.timestamp,updatedAt=Chain.timestamp,created_by = Call.caller,event_date=_date, price=_price, purchased=false}
   let index = getEventLength() + 1
   put(state{events[index]=stored_event,index_counter=index})
  
  entrypoint get_event_by_index(index:int) : eventH = 
   switch(Map.lookup(index, state.events))
     None => abort("Event does not exist with this index")
     Some(x) => x  
  
  payable stateful entrypoint buy_ticket(_id:int)=
    let eventh = get_event_by_index(_id) 
    let  _event_owner  = eventh.created_by : address
    require(eventh.id > 0,abort("NOT A Event ID"))
    require(Call.value >= eventh.price,abort("You Don't Have Enough AE"))
    Chain.spend(_event_owner, Call.value) 
`

const contractAddress ='ct_YqfqKEAfZSCW3pz4XwAukZmhfVwnaoKS1AGwEtMdtJa3wknFp'

var client = null // client defuault null
var eventListArr = [] // empty arr
var eventListLength = 0 // empty product list lenghth


// asychronus read from the blockchain
async function callStatic(func, args) {
    const contract = await client.getContractInstance(contractSource, {contractAddress});
      const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
      const decodedGet = await calledGet.decode().catch(e => console.error(e));
      return decodedGet;
}
    
//Create a asynchronous write call for our smart contract
async function contractCall(func, args, value) {
    const contract = await client.getContractInstance(contractSource, {contractAddress});
    console.log("Contract:", contract)
    const calledSet = await contract.call(func, args, {amount:value}).catch(e => console.error(e));
    console.log("CalledSet", calledSet)
    return calledSet;
}

//mustache

function renderEventList(){
    let template = $('#template').html();
    Mustache.parse(template);
    var rendered = Mustache.render(template, {eventListArr});
    $("#getEvent").html(rendered);
    console.log("start rendering")
}

// onload
window.addEventListener('load', async() => {
    $("#loader").show();
    console.log("#########################################")
    console.log("######### Load ###########")
    console.log("#########################################")
    client = await Ae.Aepp();
    eventListLength = await callStatic('getEventLength',[]);
    //display the events on the console
    console.log('List Of Events:', eventListLength);
    console.log("---------------------------------")  
    for(let i = 1; i < eventListLength + 1; i++){
      const getEventList = await callStatic('get_event_by_index', [i]);
      eventListArr.push({
        index_counter:i,
        id:getEventList.id,
        name:getEventList.name,
        description:getEventList.description,
        createdAt:new Date(getEventList.createdAt),
        updatedAt:new Date(getEventList.updatedAt),
        created_by:getEventList.created_by,
        event_date:new Date(getEventList.event_date),
        price:getEventList.price
      })
    }
    renderEventList();  
    $("#loader").hide();
  });
// click list event nav
$("#list_events_href").click(function(){
    console.log("List Event");
    /////

    $("#add_event_form").hide()
    
    $("#list_events").show()
    renderEventList() 
})
// click list evenclick list nav

//click the Create Button
$("#addButton").click(async function(){
    console.log("Hello World.....");
    // Data Picker Initialization
    var name = ($("#name").val());
    var description = ($("#description").val());
    var date =($("#date").val()) ;
    var price = ($("#price").val());
    var d = new Date(date).getTime()
    // var n = d.getTime()

    // console.log(new Date(d))
    // console.log(new Date(n))
    const new_event = await contractCall('add_event', [name, description, d,price],0);

    // clear
    $("#name").val("");
    $("#description").val("");
    $("#date").val("");
    $("#price").val("");
}) 
$("#add_event_href").click(function(){
    console.log("add Event");
    $("#list_events").hide()
    $("#add_event_form").show()
})




// // Buy A Product
$("#getEvent").on("click",".buyBtn", async function(event){
  $("#loader").show();

  const dataIndex = event.target.id
  console.log(typeof dataIndex)
  const eventListArrPrice = eventListArr[dataIndex - 1].price
  console.log("Price of product",eventListArrPrice)
  const purchased_event = await contractCall('buy_ticket', [dataIndex],parseInt(eventListArrPrice, 10));
  console.log("Purchase:", purchased_event)
  
  // const foundIndex = productListArr.findIndex(product => product.id === dataIndex)
  // const value = $(".buyBtn")[foundIndex] ;

  console.log("-----------------")
  console.log("Data Index:", dataIndex)
  console.log("--------------------------")
  
  console.log("Just Clicked The Buy Button")
  event.preventDefault();
});
