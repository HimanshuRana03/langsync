import { Server } from "socket.io"; //to create websocket server

const SocketHandler =(req,res)=>
{
    console.log("hello")
    if(res.socket.server.io)
    {
        console.log("socket already running");
    }
    else{
    const io= new Server(res.socket.server);
    res.socket.server.io=io;
    io.on('connection', (socket) => {
    console.log('server is connected'); 
    })
    }
    res.end();
}

export default SocketHandler;