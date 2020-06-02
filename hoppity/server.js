const express = require('express')
var fs = require('fs')
var async = require('async')

app = express()
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views/')
app.use(express.static('public'))

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`))

app.get('/', function(req, res) {
    res.redirect('/home')
})

app.get('/home', function(req, res) {
    res.render('pages/index')
})

app.get('/features', function(req, res) {
    res.render('pages/features')
})

app.get('/people', function(req, res) {
    res.render('pages/people')
})

app.get('/publications', function(req, res) {
    res.render('pages/publications')
})

app.get('/sponsors', function(req, res) {
    res.render('pages/sponsors')
})

app.get('/demo', function(req, res) {
    fs.readdir('./data/demo_examples/src', function(err, files) {
        if(err) {
            console.log("ERROR")
        } else {
            res.render('pages/demo', {
                file_list : files
            })
        }
    })
})

app.get('/source_file',  function(req, res) {
    // console.log(req.query)
    let filename = req.query.filename
    var count = 0
    var res_data = {}
    res_data.success = true

    if(filename.slice(-1) == "c") {
        files = [
            './data/demo_examples/src/'+filename,
            './data/demo_examples/graph/'+filename+'.json',
            './data/demo_examples/vc_file/'+filename+'.smt',
            './data/code2inv/code2inv/prog_generator/grammar_files/inv.grammar'
        ]
    } else {
        files = [
            './data/demo_examples/src/'+filename,
            './data/demo_examples/graph/'+filename+'.json',
            './data/demo_examples/vc_file/'+filename,
            './data/code2inv/code2inv/prog_generator/grammar_files/chc_inv.grammar'
        ]
    }

    async.eachSeries(
        files,
        function(fname, cb) {
            count++
            fs.readFile(fname, 'utf8', function(err, data) {
                if(err) {
                    res_data.success = false
                } else {
                    switch(count) {
                        case 1:
                            res_data.source = data
                            break
                        case 2:
                            res_data.graph = data
                            break
                        case 3:
                            res_data.vc = data
                            break
                        case 4:
                            res_data.grammar = data
                            break
                    }
                }
                cb(err)
            })
        },
        function(err) {
            if(err) {
                res_data.success = false
            }

            res.send(res_data)
        }
    )


    // fs.readFile('./data/demo_examples/src/'+filename, 'utf8', function(err, data) {
    //     if(err) {
    //         res.send(err)
    //     } else {
    //         // console.log(data)
    //         res.send(data)
    //     }
    // })
})

app.get('/solve', function(req, res) {
    let filename = req.query.filename
    graph_filename = filename + ".json"
    vc_filename = filename
    spec = "spec"
    // console.log("FILE NAME" + filename)
    if (filename.slice(-1) == "c") {
        spec = "c_" + spec
        vc_filename += ".smt"
    } else {
        spec = "chc_" + spec
    }
    solver_command = "cd ./data/code2inv/code2inv/prog_generator;" +
                     "timeout 5m ./run_solver_file.sh ../../../demo_examples/graph/" + graph_filename +
                     " ../../../demo_examples/vc_file/" + vc_filename + " specs/" + spec

    let exec = require('child_process').exec

    exec(solver_command, function(error, stdout, stderr) {
        if(error) {
            // console.log(error)
            // res.send("AN ERROR OCCURRED")
            res.send({
                success: false,
                filename: filename
            })
        } else {
            // console.log(stdout)
            result_invar = stdout.match("sol: (.*)\n")[1]
            time = stdout.match("time: (.*) pid")[1]
            stats = JSON.parse(stdout.match("Counter\((.*)\)")[1].replace(/'/g, '"').slice(1, -1))
            // console.log(result_invar)
            // console.log("FILE NAME" + filename)
            res.send({
                success: true,
                invar : result_invar,
                time: time,
                stats: stats,
                filename: filename
            })
        }
    })
})

app.get('*', function(req, res) {
    res.render('pages/404')
})
