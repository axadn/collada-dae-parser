var MultipleMeshError = require('./multiple-mesh-error-message.js')

module.exports = ParseLibraryGeometries

function ParseLibraryGeometries (library_geometries) {
  // We only support models with 1 geometry. If the model zero or
  // multiple meshes we alert the user
  if (library_geometries[0].geometry.length !== 1) {
    throw new MultipleMeshError(library_geometries[0].geometry.length)
  }

  var geometryMesh = library_geometries[0].geometry[0].mesh[0]
  var source = geometryMesh.source
  /* Vertex Positions, UVs, Normals */
  var polylistIndices = (geometryMesh.polylist || geometryMesh.triangles)[0].p[0].split(' ')

//vertex data order is now flexible, vertex colors have been added 
  const polylistInputs = (geometryMesh.polylist || geometryMesh.triangles)[0].input.map(el=> el.$)

  const offsetOutputMap = {};
  const semantics = ["VERTEX", "NORMAL", "COLOR", "TEXCOORD"]
  const outputs = {}
  semantics.forEach(semantic=>{
    outputs[semantic] = {indices: [], elements: []}
  });
  polylistInputs.forEach(input =>{
    offsetOutputMap[input.offset] = input.semantic;
    if(outputs[input.semantic]){
      outputs[input.semantic].elements =
        (semantic=>{
          let dataSource;
          dataSource = source.find(sourceElement=> sourceElement.$.id ==input.source.slice(1));
          if(!dataSource && semantic == "VERTEX"){
            dataSource = geometryMesh.vertices.find(sourceElement=> sourceElement.$.id == input.source.slice(1))
            dataSource = source.find(sourceElement=> sourceElement.$.id = dataSource.input[0].$.source.slice(1))
          }
          return dataSource;
        })(input.semantic).float_array[0]._.split(' ').map(Number)
    }
  });

  polylistIndices.forEach(function (vertexIndex, positionInArray) {
      if(offsetOutputMap[positionInArray % source.length]){
      outputs[offsetOutputMap[positionInArray % source.length]].indices.push(Number(vertexIndex));
    }
  });

  return {
    vertexPositions: outputs.VERTEX.elements,
    vertexNormals: outputs.NORMAL.elements,
    vertexUVs: outputs.TEXCOORD.elements,
    vertexColors: outputs.COLOR.elements,
    vertexNormalIndices: outputs.NORMAL.indices,
    vertexPositionIndices: outputs.VERTEX.indices,
    vertexUVIndices: outputs.TEXCOORD.indices,
    vertexColorIndices: outputs.COLOR.indices
  }
}

