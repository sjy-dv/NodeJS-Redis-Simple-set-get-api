const cluster = require('cluster');
const isWin = process.platform === 'win32';

if ( cluster.isMaster ) {
    console.log(`${process.pid} master`)
    var cpuCount = require('os').cpus().length;
        for (var i = 0; i < cpuCount ; i++) {
            cluster.fork();
            console.log(`cluster on ${i}`);
        }
    cluster.on('exit', function (worker) {
        console.log(`Worker : ${worker.id} died`);
        cluster.fork();
    });
} else {
    const express = require('express');
    const app = express(); 

    app.use(express.json());
    app.use(express.urlencoded({extended : false}));

    const redis = require('redis').createClient('6379','127.0.0.1');
    redis.on('error', (err) => {
        console.log(err);
    })

    app.get('/', (req,res) => {
        res.send('hello world');
    })

    app.get('/simpleget', async (req, res) => {
        try {
            await redis.get('name', (err, reply) => {
                if(err) return err;
                console.log(reply);
                res.send(reply);
            });
        } catch (error) {
            res.send(error);
        }
    });

    app.post('/simpleset', async (req,res) => {
        try {
            let { name } = req.body;
            await redis.set('name', name);
            res.json({result : 'success'});    
        } catch (error) {
            res.send(error);
        }      
    });

    app.post('/arrayset', async (req, res) => {
        try {
            let { username, password } = req.body;
            const rows = await redis.hmset('user', username, password);
            if(!rows) throw res.send('redis set error');
            res.status(200).json({result : 'success'});
        } catch (error) {
            res.send(error);
        }
    });

    app.get('/arrayget', async (req, res) => {
        try {
            await redis.hgetall('user', (err, reply) => {
                if(err) throw res.send(err);
                res.send(reply);
            });
        } catch (error) {
            res.send(error);
        }
    }) ;
 
    app.post('/check_key', async(req,res) => {
        try {
            let { key } = req.body;
            const result = await redis.exists(key);
            if(!result) throw res.send('not according data');
            res.send('data is exist');
        } catch (error) {
            res.send(error);
        }
    });

    app.post('/renamekey', async(req,res) => {
        try {
            let { key } = req.body;
            const result = await redis.rename('user', key);
            if(!result) throw res.send('rename is failed');
            res.send(`change complete user => ${key}`);
        } catch (error) {
            res.send(error);
        }
    });

    app.post('/delkey', async(req,res) => {
        try {
            let { key } = req.body;
            const result = await redis.del(key);
            if(!result) throw res.send('delete failed');
            res.send(`delete complete key = ${key}`);
        } catch (error) {
            res.send(error);
        }
    });

    setTimeout(function(){
        console.log(`worker : ${process.pid} is join`);
        if(cluster.isWorker){
            console.log(`worker is running : nomotopic`);
        }else{
            console.log(`worker is not defined`);
        }
    },1000);

    app.listen(8081 , (error) => {
        if(error){
            console.log(error);
        }
    })
}