var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["subject.js"];
	}
	var filePath = args[0];

	constraints(filePath);

	generateTestCases()

}


function fakeDemo()
{
	console.log( faker.phone.phoneNumber() );
	console.log( faker.phone.phoneNumberFormat() );
	console.log( faker.phone.phoneFormats() );
}

var functionConstraints =
{
}

var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists': {}
	},

	fileWithContent:
	{
		pathContent: 
		{	
  			file1: 'text content'
  		}
		
	 },
	 fileWithoutContent:
	 {
	 	pathContent: 
	 	{	
   			file1: ''
   	 	}
	}
};


// var mockFileLibrary2 = 
// {
// 	pathExists2:
// 	{
// 		'path1/fileExists': {}
// 	},
// 	fileWithoutContent:
// 	{
// 		pathContent2: 
// 		{	
//   			file2: '',
//   			//file2: '',
// 		}
// 	}
// };


function generateTestCases()
{

	var content = "var subject = require('./subject.js')\nvar mock = require('mock-fs');\n";
	for ( var funcName in functionConstraints )
	{
		var params = {};

		// initialize params
		for (var i =0; i < functionConstraints[funcName].params.length; i++ )
		{
			var paramName = functionConstraints[funcName].params[i];
			//params[paramName] = '\'' + faker.phone.phoneNumber()+'\'';
			params[paramName] = '\'\'';
		}
		//debugstmt
		console.log( params );

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {mocking: 'fileWithContent' });
		var pathExists      = _.some(constraints, {mocking: 'fileExists' });
		//var fileWithoutContent = _.some(constraints, {mocking: 'fileWithoutcontent' });

		// var fileWithContent2 = _.some(constraints, {mocking: 'fileWithContent2' });
		// var pathExists2      = _.some(constraints, {mocking: 'fileExists' });

		var mycode = _.some(constraints,{value:'212'});
		var undefinedval = _.some(constraints,{value:'undefined'});
		var zerovar = _.some(constraints,{value:'0'});
		var truevar = _.some(constraints,{value:true});
		var falsevar = _.some(constraints,{value:false});


		for( var c = 0; c < constraints.length; c++ )
		{
			var constraint = constraints[c];
			//debugstmt
			//console.log("i am the constraint"+ constraint)
			if( params.hasOwnProperty( constraint.ident ) )
			{
				params[constraint.ident] = constraint.value;
			}
		}

		// Prepare function arguments.
		var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
		//debugstmt
		console.log(args)
		if( pathExists || fileWithContent)
		{
			 content += generateMockFsTestCases(pathExists,fileWithContent,funcName, args);
			
				// Bonus...generate constraint variations test cases....
				content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName, args);
				content += generateMockFsTestCases(!pathExists,fileWithContent,funcName, args);
				content += generateMockFsTestCases(pathExists,!fileWithContent,funcName, args);
				content += generateMockFsTestCases(!pathExists,fileWithContent,funcName, args);
				 //if file w/o content
				//content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName, args);

				//console.log(mockFileLibrary.fileWithContent.pathContent.file1);
		}

		// if(pathExists || fileWithoutContent)
		// {
		// 	content += generateMockFsTestCases(pathExists,fileWithoutContent,funcName, args);
		// 	content += generateMockFsTestCases(!pathExists,fileWithoutContent,funcName, args);
		// 	content += generateMockFsTestCases(pathExists,!fileWithContent,funcName, args);
		// 	content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName, args);
		// }

		
		else if(undefinedval || zerovar)
		{
			content += "subject.{0}({1});\n".format(funcName, args);
			content += "subject.{0}({1});\n".format(funcName, "'-3','10'");
			content += "subject.{0}({1});\n".format(funcName, "'-8','undefined'");
			
		}
		//maintain order
		else if(truevar || falsevar)
		{

			var phone=faker.phone.phoneNumberFormat();
			var format=faker.phone.phoneFormats();
			var options = "{normalize:true}".toString();
			content += "subject.{0}({1});\n".format(funcName, "'"+phone+"','"+format+"',"+options);
		}
		//maintain order
		else if(!mycode)
		{
			// Emit simple test case.
			var randomvar = faker.phone.phoneNumberFormat();
			content+= "subject.{0}({1});\n".format(funcName, "'212-113-669'");
			content+="subject.{0}({1});\n".format(funcName, "'"+randomvar+"'");
		}

		else
		{
			content += "subject.{0}({1});\n".format(funcName, args);
		}

	}
	fs.writeFileSync('test.js', content, "utf8");
}

function generateMockFsTestCases (pathExists,fileWithContent,funcName,args) 
{
	var testCase = "";
	// Insert mock data based on constraints.
	var mergedFS = {};
	var zeros = _.some(constraints, {value: '0'});
	
	if( pathExists )
	{
		for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
	}
	if( fileWithContent )
	{
		for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
	}

	 if( !fileWithContent )
	 {
	 	for (var attrname in mockFileLibrary.fileWithoutContent) { mergedFS[attrname] = mockFileLibrary.fileWithoutContent[attrname]; }
	 }

	testCase += 
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";

	testCase += "\tsubject.{0}({1});\n".format(funcName, args );
	testCase+="mock.restore();\n";
	return testCase;
}

// function generateMyTestCases (pathExists2,fileWithContent2,funcName,args) 
// {
// 	var testCase = "";
// 	// Insert mock data based on constraints.
// 	var mergedFS = {};
// 	var zeros = _.some(constraints, {value: '0'});
	
// 	if( pathExists2 )
// 	{
// 		for (var attrname in mockFileLibrary2.pathExists2) { mergedFS[attrname] = mockFileLibrary2.pathExists2[attrname]; }
// 	}
// 	if( fileWithContent2 )
// 	{
// 		for (var attrname in mockFileLibrary2.fileWithContent2) { mergedFS[attrname] = mockFileLibrary2.fileWithContent2[attrname]; }
// 	}

// 	// if(!fileWithContent)
// 	// {
// 	// 	for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
// 	// 	mergedFS['pathContent']['file1'] = "";
// 	// }


// 	testCase += 
// 	"mock(" +
// 		JSON.stringify(mergedFS)
// 		+
// 	");\n";

// 	testCase += "\tsubject.{0}({1});\n".format(funcName, args );
// 	testCase+="mock.restore();\n";
// 	return testCase;
// }

function constraints(filePath)
{
   var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);

	traverse(result, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var funcName = functionName(node);
			console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};

			// Check for expressions using argument.
			traverse(node, function(child)
			{
				if( child.type === 'BinaryExpression' && child.operator == "==")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						//var expression = buf.substring(child.range[0], child.range[1]);
						//console.log("Hello"+child.right.range[0])
						//	console.log(child.right.range[1])
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						functionConstraints[funcName].constraints.push( 
							{
								ident: child.left.name,
								value: rightHand
							});
					}
				}

			if( child.type === 'BinaryExpression' && child.operator == "<")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

							functionConstraints[funcName].constraints.push( 
							{
								ident: child.left.name,
								value: rightHand
							});
					}
				}



				if( child.type === 'BinaryExpression' && child.operator == ">")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
							
							functionConstraints[funcName].constraints.push( 
							{
								ident: child.left.name,
								value: rightHand
							});
					}
				} 
				

				if( child.type === 'BinaryExpression' && child.operator == ">")
				{
							if( child.left.type == 'MemberExpression' && child.left.property.name=='length')
							
								{
									var rightHand = buf.substring(child.right.range[0], child.right.range[1])
								
									functionConstraints[funcName].constraints.push(
											{
												ident: child.left.object.name,
												value: rightHand
											});


								}
					}

				if( child.type == 'LogicalExpression' && child.operator=="||")
				{

					if(child.left.type=='UnaryExpression')
					{
						functionConstraints[funcName].constraints.push(
							{
							ident: child.left.argument.name,
							value: true,
							}
							);
						functionConstraints[funcName].constraints.push(
							{
							ident: child.left.argument.name,
							value: false,
							}
							);
					}

					if(child.right.type=='UnaryExpression' && child.right.operator == "!"){
							if(child.right.argument.type=='MemberExpression'){
									functionConstraints[funcName].constraints.push(
									{
										ident: child.right.argument.object.name+'.'+child.right.argument.property.name,
										value: true,
									}
									);
								}
							}
				}

				if( child.type === 'BinaryExpression' && child.operator == "<")
				{
							if( child.left.type == 'MemberExpression' && child.left.property.name=='length')
							{
									var rightHand = buf.substring(child.right.range[0], child.right.range[1])
									functionConstraints[funcName].constraints.push(
											{
												ident: child.left.object.name,
												value: rightHand
											});
								}
				}


			if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							{
								// A fake path to a file
								ident: params[p],
								value: "'pathContent/file1'",
								mocking: 'fileWithContent'
							});
						}
					}

					
				}

				// if( child.type == "CallExpression" && 
				// 	 child.callee.property &&
				// 	 child.callee.property.name =="readFileSync" ) {
				// for( var p =0; p < params.length; p++ )
				// 	{
				// 		if( child.arguments[0].name == params[p] )
				// 		{
				// 			functionConstraints[funcName].constraints.push( 
				// 			{
				// 				// A fake path to a file
				// 				ident: params[p],
				// 				value: "'pathContent2/file1'",
				// 				mocking: 'fileWithContent'
				// 			});
				// 		}
				// 	}
				// }



				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							{
								// A fake path to a file
								ident: params[p],
								value: "'path/fileExists'",
								mocking: 'fileExists'
							});
						}
					}
				}

				
			});

			console.log( functionConstraints[funcName]);

		}
	});
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();