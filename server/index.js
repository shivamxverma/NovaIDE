const http = require('http');
const express = require('express');
const { Server : SocketServer } = require('socket.io');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());

const server = http.createServer(app);

const pty = require('node-pty');
const os = require('os');
const shell = os.platform() === 'darwin' ? 'zsh' : 'bash';

const ptyProcesss = pty.spawn(shell,[],{
  name : 'xterm-color',
  cols : 80,
  rows : 30,
  cwd : process.env.INIT_CWD + '/user',
  env : process.env
})



const io = new SocketServer({
  cors : '*'
});

io.attach(server);

ptyProcesss.onData(data => {
  io.emit('terminal:data',data);
})

io.on('connection',(socket)=>{
  console.log('Socket Connected');
  socket.on('terminal:write',(data)=>{
    ptyProcesss.write(data);
  })
})


app.get('/files',async(req,res)=>{
   const fileTree = await generateFileTree('/user');
   return res.json({tree : fileTree});
})

async function generateFileTree(directory){
  const tree = {};
  
  async function buildTree(currentDir,currentTree) {
    const files = await fs.readdir(currentDir)

    for(const file of files){
      const filePath = path.join(currentDir,file);
      const stat = fs.stat(filePath);

      if(stat.isDirectory){
        currentTree[file] = {}
        await buildTree(filePath,currentTree[file]);
      } else {
        currentTree(file) = null;
      }
    }
  }
  await buildTree(directory,tree);

  return tree;
}

server.listen(9000,()=>{
  console.log('Server is started at port 9000');
});