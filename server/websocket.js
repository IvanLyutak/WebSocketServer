const ws = require('ws');
const {MongoClient} = require('mongodb');

const client = new MongoClient("mongodb://localhost:27018,localhost:27019,localhost:27020/?replicaSet=mongo-repl", { useUnifiedTopology: true}, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1})
client.connect()

const wss = new ws.Server({
    port: 5000,
}, () => console.log('Server started on 5000'))

const database = client.db("websocket")

var webSockets = new Object()
var streams = new Object()


wss.on('connection', function connection(ws) {
    ws.on('message', function (message) {
        
        var message = JSON.parse(message);
        webSockets[message.id] = new Set(webSockets[message.id]).add(ws)
        
        switch (message.event) {
            case 'connection':
                ws.send(JSON.stringify({
                    message: "OK",
                    event: 'message_bot'
                }))
                break
                
            case 'observeSingleEvent':
                console.log("observeSingleEvent")
                let elements = parse_data(message.path)

                if (elements.path_value) {
                    database.collection(elements.name_collection).distinct(elements.path_value, {"_id": elements.id}, function (err, data) {
                        if (err) return console.log("error");
                        if (data.length === 0) return console.log("no data");
                        const message_bot = {
                            message: `Полученные данные - ${data}`,
                            event: 'message_bot'
                        }
                        ws.send(JSON.stringify(message_bot))
                    });
                } else {
                    database.collection(elements.name_collection).findOne({"_id": elements.id}, function (err, data) {
                        if (err) return console.log("error");
                        if (data.length === 0) return console.log("no data");
                        const message_bot = {
                            message: `Полученные данные - ${data}`,
                            event: 'message_bot'
                        }
                        ws.send(JSON.stringify(message_bot))
                    });
                }
                break
            case 'observe':
                console.log("observe")
                let elements_observe = parse_data(message.path)
                var path_last = elements_observe.path_value.split(".").slice(-1)

                console.log("Connected to MongoDB server");
                const collection = database.collection(elements_observe.name_collection);

                filter = []
                if (elements_observe.path_value !== undefined) {
                    let string = "updateDescription.updatedFields." + elements_observe.path_value
                    filter = [{
                        $match: {
                            $and: [
                                {"documentKey._id": elements_observe.id},
                                { [string]: { $exists: true } },
                                { operationType: "update" }
                            ]
                        }
                    }];
                } else {
                    filter = [{
                        $match: {
                            $and: [
                                {"documentKey._id": elements_observe.id},
                                { operationType: "update" }
                            ]
                        }
                    }];
                }
                    
                var options = { fullDocument: 'updateLookup' };
                const changeStream = collection.watch(filter, options);

                var new_data = []
                if (streams[message.id] !== undefined) {
                    for (stream of streams[message.id]) {
                        for (item of stream.length) {
                            if (item["type"] === ws){
                                new_data = item["data"]
                                return
                            }
                        }
                    }
                }
                new_data = new Set(new_data).add(changeStream)
                streams[message.id] = new Set(streams[message.id]).add({type:ws, data: new_data})

                // start listen to changes
                changeStream.on("change", function(event) {
                    if (elements_observe.path_value !== undefined){
                        const message_bot = {
                            message: JSON.stringify(event["updateDescription"]["updatedFields"][path_last]),
                            event: 'message_bot'
                        }  
                        ws.send(JSON.stringify(message_bot))
                    } else {
                        const message_bot = {
                            message: JSON.stringify(event["updateDescription"]["updatedFields"]),
                            event: 'message_bot'
                        }  
                        ws.send(JSON.stringify(message_bot))
                    }
                });

                //webSockets[message.id] = new Set(webSockets[message.id]).add(ws)
                //for (item of webSockets[message.id]) {
                //    item.send(JSON.stringify(message))
                //}
                break

            case 'setValue':
                console.log("setValue")
                let elements_setValue = parse_data(message.path)

                database.collection(elements_setValue.name_collection).findOne({"_id": elements_setValue.id}, function (err, data) {
                    if (err) return console.log("error");
                    if (data === null) {
                        console.log("NEW")
                        database.collection(elements_setValue.name_collection).insertOne({_id: elements_setValue.id, name: message.username})
                        return
                    };
                    console.log("OLD")
                    database.collection(elements_setValue.name_collection).updateOne(
                        {_id: elements_setValue.id}, 
                        { $set: {[elements_setValue.path_value]: message.username}},
                        function(err, result){    
                                console.log(result);
                        }
                    );
                })
                break

            case 'removeValue':
                console.log("removeValue")
                let elements_removeValue = parse_data(message.path)
                if (elements_removeValue.path_value) {
                    database.collection(elements_removeValue.name_collection).updateOne({_id: elements_removeValue.id},{$unset:{
                        [elements_removeValue.path_value]:""
                    }})
                } else {
                    database.collection(elements_removeValue.name_collection).deleteOne( {"_id": elements_removeValue.id});
                } 
                break
                
            default: 
                ws.send(JSON.stringify({
                    message: 'ошибка',
                    event: 'message_bot'
                }))
                break
        }
    })

    ws.on('close', function() {
        for (const [key, value] of Object.entries(webSockets)) {
            console.log('Удаление соединения: ', key);
            value.delete(ws)
            if (streams[key] !== undefined) {
                for (item of streams[key]) {
                    if (item["type"] === ws){
                        for (i of item["data"]) {
                            i.close();
                        }
                        streams[key].delete(item);
                        if (streams[key].size === 0) {
                            delete streams[key]
                        }
                        break
                    }
                }
            }
            console.log("Streams: ", streams)
            if (value.size === 0) {
                delete webSockets[key]; 
            }
        }
        console.log("webSockets: ", webSockets)
      })
})


function parse_data(message) {
    path = message.split('/')
    var obj = {
        name_collection: path[0],
        id: path[1],
        path_value: path[2]
    };
    for (index = 3; index < path.length; ++index) {
       obj.path_value = obj.path_value + "." + path[index]

    }
    return obj
} 


function broadcastMessage(message, username) {
    wss.clients.forEach(client => {
            console.log(client)
            client.send(JSON.stringify(message))
    })
}