/*
 * Copyright The NOMAD Authors.
 *
 * This file is part of NOMAD. See https://nomad-lab.eu for further info.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useMemo
} from 'react'
import { useResizeDetector } from 'react-resize-detector'
import { makeStyles } from '@material-ui/core'
import PropTypes from 'prop-types'
import { isNil, isEqual } from 'lodash'
import { Stage } from 'ngl'
import StructureBase from './StructureBase'
import * as THREE from 'three'
import { withErrorHandler } from '../ErrorHandler'
import { useAsyncError } from '../../hooks'
import { useApi } from '../api'

const useStyles = makeStyles((theme) => ({
  canvas: {
    width: '100%',
    height: '100%'
  },
  canvasParent: {
    height: '100%',
    width: '100%',
    boxSizing: 'border-box'
  }
}))
const StructureNGL = React.memo(({
  data,
  topologyTree,
  topologyMap,
  entryId,
  selection,
  sizeLimit,
  onFullscreen,
  ...rest
}) => {
  const styles = useStyles()
  const {height, width, ref: canvasParentRef} = useResizeDetector()
  const [species, setSpecies] = useState()
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState()
  const [accepted, setAccepted] = useState()
  const [noData, setNoData] = useState(false)
  const [ready, setReady] = useState(false)
  const [showBonds, setShowBonds] = useState(true)
  const [showCell, setShowCell] = useState(true)
  const [showLatticeConstants, setShowLatticeConstants] = useState(true)
  const [disableShowLatticeConstants, setDisableShowLatticeContants] = useState(true)
  const [wrap, setWrap] = useState(true)
  const [disableShowCell, setDisableShowCell] = useState(false)
  const [disableShowBonds, setDisableShowBonds] = useState(false)
  const stageRef = useRef()
  const viewerRef = useRef()
  const componentsRef = useRef({})
  const componentRef = useRef()
  const canvasRef = useRef()
  const readyRef = useRef(true)
  const alignmentRef = useRef()
  const rotationsRef = useRef()
  const representationMap = useRef({})
  const selectionRef = useRef()
  const { api } = useApi()
  const asyncError = useAsyncError()

  // Fetch the number of atoms
  const nAtoms = useMemo(() => {
    const nAtoms = Object.values(topologyMap).find((top) => top.label === "original").n_atoms
    if (nAtoms > 500) {
      setShowBonds(false)
      setDisableShowBonds(true)
    }
    if (nAtoms > sizeLimit) {
      setPrompt(
        `Visualization is by default disabled for systems with more than ${sizeLimit} ` +
        `atoms. Do you wish to enable visualization for this system with ${nAtoms} atoms?`
        )
      setAccepted(false)
    } else {
      setPrompt()
      setAccepted(true)
    }
    return nAtoms
  }, [sizeLimit, topologyMap])

  // Updated the list of the species for the currently shown system
  useEffect(() => {
    const elements = topologyMap[selection]?.elements
    let species
    if (elements) {
      try {
        species = elements.map(symbol => {
          const symbolUpperCase = symbol.toUpperCase()
          const atomicNumber = atomicNumbers[symbolUpperCase]
          const color = elementColors[symbolUpperCase]
          return {
            label: symbol,
            color: color ? `#${color.toString(16)}` : '#ff1493',
            radius: vdwRadii[atomicNumber] || 0.1,
            atomicNumber: atomicNumber || 0
          }
        })
      } catch {
      }
    }
    setSpecies(species)
  }, [selection, topologyMap])

  // Forces a three.js render
  const render = useCallback(() => {
    viewerRef.current.render()
  }, [])

  // Toggles bond visiblity on all representations
  const handleShowBonds = useCallback((value) => {
    setShowBonds(value)
    for (const repr of Object.values(representationMap.current)) {
      repr.bonds.setVisibility(value)
    }
  }, [])

  // Toggles cell visibility on all components
  const handleShowCell = useCallback((value, updateState) => {
    if (updateState) setShowCell(value)
    for (const component of Object.values(componentsRef.current)) {
      const unitCell = component.unitCell
      if (unitCell) unitCell.visible = value
    }
    render()
  }, [render])

  // Toggles latticeConstant visibility on all components
  const handleShowLatticeConstants = useCallback((value, updateState) => {
    if (updateState) setShowLatticeConstants(value)
    for (const component of Object.values(componentsRef.current)) {
      const latticeConstants = component.latticeConstants
      if (latticeConstants) latticeConstants.visible = value
    }
    render()
  }, [render])

  // Toggles position wrapping on all components
  const handleWrap = useCallback((value) => {
    setWrap(value)
    for (const component of Object.values(componentsRef.current)) {
      wrapPositions(component, value)
    }
    componentRef.current.autoView(selectionRef.current)
  }, [])

  /**
   * Apply the given alignment and rotation to the component.
   *
   * @param {*} alignment The alignment to apply.
   * @param {THREE.Euler} rotation The rotation to apply.
   * @param {Vector3[]} basis The basis vectors.
   * @param {*} component The component to which the view is applied to.
   */
  const view = useCallback(() => {
      const rotations = rotationsRef.current
      const alignment = alignmentRef.current
      const component = componentRef.current
      const basis = component.basis

      // Reset the control orientation
      component.stage.viewerControls.orient(new THREE.Matrix4())

      // Get quaternion that aligns the lattice vectors
      const quaternion = basis
        ? getAlignment(alignment, {a: basis[0], b: basis[1], c: basis[2]})
        : new THREE.Quaternion()

      // Apply additional rotations to quaternion
      for (const rotation of rotations) {
        const quaternionRotate = new THREE.Quaternion()
        quaternionRotate.setFromEuler(new THREE.Euler(...rotation.map(r => -r / 180 * Math.PI)))
        quaternion.premultiply(quaternionRotate)
      }

      component.setRotation(quaternion)
  }, [])

  // Resets the zoom and alignment
  const handleReset = useCallback(() => {
    view()
    componentRef.current.autoView(selectionRef.current)
  }, [view])

  // Resizes the canvas to fit current parent
  const handleResize = useCallback((width, height) => {
      if (!componentRef.current) return
      canvasRef.current.style.width = `${width}px`
      canvasRef.current.style.height = `${height}px`
      stageRef.current.handleResize()
      componentRef.current.autoView(selectionRef.current)
  }, [])

  // Whenever the canvas parent size changes, resize the WebGL canvas.
  useLayoutEffect(() => {
    handleResize(width, height)
  }, [width, height, handleResize])

  const handleFullscreen = useCallback(() => {
    onFullscreen && onFullscreen()
  }, [onFullscreen])

  const handleTakeScreenshot = useCallback(async (name) => {
    if (!stageRef.current) return
    const imgData = await stageRef.current.makeImage()
    try {
      const link = document.createElement('a')
      link.style.display = "none"
      document.body.appendChild(link)
      const url = window.URL.createObjectURL(imgData)
      const filename = name + ".png"
      link.href = url
      link.download = filename
      link.click()
      document.body.removeChild(link)
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 0)
    } catch (e) {
    }
  }, [])

  // Initialize the viewer
  useEffect(() => {
    const drawDistance = 1000
    const stage = new Stage(
      canvasRef.current,
      {
        backgroundColor: "white",
        cameraType: "orthographic",
        clipNear: 0,
        clipFar: drawDistance,
        clipDist: 0,
        zoomSpeed: 5,
        fogNear: 0,
        fogFar: drawDistance
      }
    )
    stageRef.current = stage
    viewerRef.current = stage.viewer
  }, [])

  /**
   * Used to asynchronously load a new component to the NGL viewer. Since
   * loading the structure is a long-taking operation, running this function
   * later in the event queue allows the component to perform state updates
   * (e.g. loading placeholder) while the viewer is loading.
   */
  const loadComponent = useCallback(async (entryId, data, topologyMap) => {
    // Load the structure if not already cached
    let component = componentsRef.current[data]
    if (!component) {
      const system = await api.get(
        `systems/${entryId}`,
        {path: data, format: 'pdb'},
        {responseType: 'blob'}
      )

      // Load file
      component = await stageRef.current.loadFile(
        system,
        {ext: 'pdb', defaultRepresentation: false}
      )

      // Find the root topology item for this data.
      let root
      for (const [key, top] of Object.entries(topologyMap)) {
        if (key === data || top.atoms_ref?.slice(0, -6) === data) {
          root = key
          break
        }
      }

      // Recursively add a new representation for each child that does not have
      // it's own component
      function addRepresentation(top) {
        const structuralType = top.structural_type
        const isMonomer = structuralType === 'monomer'
        const isMolecule = structuralType === 'molecule'
        const sele = top.indices
          ? `@${((isMolecule || isMonomer)
            ? top.indices[0]
            : top.indices).flat().join(',')}`
          : 'all'

        // Add representation for the bonds
        const bondRepr = component.addRepresentation(
          'licorice',
          {
            colorScheme: 'uniform',
            colorValue: 'white',
            bondScale: 0.1,
            sele
          }
        )
        // Add representation for the atoms
        const atomRepr = component.addRepresentation('spacefill', {radiusScale: 0.3, sele})
        representationMap.current[top.system_id] = {
          bonds: bondRepr,
          atoms: atomRepr,
          sele: sele
        }
        for (const child of top.child_systems || []) {
          if (!child.atoms) addRepresentation(child)
        }
      }
      addRepresentation(topologyMap[root])

      // Add a completely custom unit cell and lattice parameter visualization.
      // The objects are added to a dummy 'unitcell' representation that is
      // supported by NGL.
      const nglCell = component?.object?.unitcell
      const collapsed = [false, false, false]
      const pbc = [true, true, true]
      if (nglCell) {
        component.addRepresentation('unitcell', {opacity: 0})
        const fracToCart = nglCell.fracToCart
        const a = new THREE.Vector3(1, 0, 0).applyMatrix4(fracToCart)
        const b = new THREE.Vector3(0, 1, 0).applyMatrix4(fracToCart)
        const c = new THREE.Vector3(0, 0, 1).applyMatrix4(fracToCart)
        const basis = [a, b, c]
        const cell = createCell(
          new THREE.Vector3(),
          basis,
          collapsed,
          pbc,
          '#000',
          1,
          0,
          0
        )
        addObject3DToStage(cell, stageRef.current)
        const latticeConstants = createLatticeConstants(
          basis,
          pbc,
          collapsed,
          {
              font: 'Titillium Web,sans-serif',
              size: 0.7,
              stroke: {width: 0.06, color: "#000"},
              a: {enabled: true, color: "#C52929", label: "a"},
              b: {enabled: true, color: "#47A823", label: "b"},
              c: {enabled: true, color: "#3B5796", label: "c"},
              alpha: {enabled: true, color: "#ffffff", label: "α"},
              beta: {enabled: true, color: "#ffffff", label: "β"},
              gamma: {enabled: true, color: "#ffffff", label: "γ"}
          }
        )
        addObject3DToStage(latticeConstants, stageRef.current)
        component.unitCell = cell
        component.basis = basis
        component.pbc = pbc
        component.latticeConstants = latticeConstants

        // Perform a default wrap for the component
        wrapPositions(component, wrap)
      }
    }
    componentRef.current = component
    componentsRef.current[data] = component
  // We dont want this effect to react to 'wrap'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, wrapPositions])

  // Called whenever the system changes. Loads the structure asynchronously.
  useEffect(() => {
    setLoading(true)
    readyRef.current = false
    setReady(false)
    setNoData(data === false)
    if (!data) return

    // For large systems we ask the user for permission
    if (!accepted) return

    // Remember to catch since react error boundaries do not automatically catch
    // from async calls.
    loadComponent(entryId, data, topologyMap)
      .catch(asyncError)
      .finally(() => {
        // Hide other components that have been loaded
        for (const [name, component] of Object.entries(componentsRef.current)) {
          component.setVisibility(name === data)
        }
        setReady(true)
        readyRef.current = true
      })
  }, [entryId, data, topologyTree, topologyMap, api, asyncError, loadComponent, accepted])

  // React to selection
  useEffect(() => {
    if (!ready || !readyRef.current) return

    // Resolve how the selected topology should be visualized.
    const topSelection = topologyMap[selection]
    const topParent = topologyMap[selection].parent_system
    const structuralType = topSelection.structural_type
    const isMonomer = structuralType === 'monomer'
    const isGroup = structuralType === 'group'
    const isSubSystem = structuralType === 'subsystem'
    const child_types = topSelection.child_systems
      ? new Set(topSelection.child_systems.map(x => x.structural_type))
      : new Set()
    const isMonomerGroup = isGroup && isEqual(child_types, new Set(['monomer']))
    const isMolecule = structuralType === 'molecule'
    const showParent = isGroup || isSubSystem

    // Determine the selection to center on.
    selectionRef.current = representationMap.current[(isMonomerGroup
      ? topParent
      : selection
    )]?.sele

    // Determine the selections to show opaque
    const opaque = new Set([selection])

    // Determine the selections to show transparent
    const transparent = new Set(showParent ? [topParent] : [])

    // Determine whether to show cell
    const cellVisible = !(isMolecule || isMonomer || isMonomerGroup)
    if (cellVisible) {
      handleShowCell(showCell)
      handleShowLatticeConstants(showCell)
    } else {
      handleShowCell(false, false)
      handleShowLatticeConstants(false, false)
    }
    setDisableShowCell(!cellVisible)
    setDisableShowLatticeContants(!cellVisible)

    // Loop through representations and set the correct visualization
    for (const [key, value] of Object.entries(representationMap.current)) {
      const transparency = opaque.has(key) ? 1 : transparent.has(key) ? 0.1 : 0
      if (transparency) {
        value.atoms.setParameters({opacity: transparency})
        value.bonds.setParameters({opacity: transparency})
        value.atoms.setVisibility(true)
        value.bonds.setVisibility(showBonds)
      } else {
        value.atoms.setParameters({opacity: 0})
        value.atoms.setVisibility(false)
        value.bonds.setVisibility(false)
      }
    }

    // Configure and reset the view based on the basis vectors.
    const nBasis = 3
    if (nBasis === 3) {
      alignmentRef.current = [['up', 'c'], ['right', 'a']]
      rotationsRef.current = [[0, 30, 0], [30, 0, 0]]
    }
    handleReset()
    setLoading(false)
  // We don't want this effect to react to 'showCell', 'showBonds' or
  // 'showLatticeParameters'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, ready, topologyMap, handleShowCell, handleShowLatticeConstants, handleReset])

  return <StructureBase
    onTakeScreenshot={handleTakeScreenshot}
    onFullscreen={handleFullscreen}
    onReset={handleReset}
    wrap={wrap}
    onWrap={handleWrap}
    showLatticeConstants={showLatticeConstants}
    onShowLatticeConstants={handleShowLatticeConstants}
    disableShowLatticeConstants={disableShowLatticeConstants}
    accepted={accepted}
    onAccept={() => { setAccepted(true); setPrompt() }}
    showBonds={showBonds}
    onShowBonds={handleShowBonds}
    disableShowBonds={disableShowBonds}
    showCell={showCell}
    onShowCell={handleShowCell}
    disableShowCell={disableShowCell}
    float={false}
    species={species}
    loading={loading}
    noData={noData}
    nAtoms={nAtoms}
    prompt={prompt}
    sizeLimit={sizeLimit}
    {...rest}
  >
    <div ref={canvasParentRef} className={styles.canvasParent}>
      <div ref={canvasRef} className={styles.canvas}/>
    </div>
  </StructureBase>
})

StructureNGL.propTypes = {
  entryId: PropTypes.string,
  data: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string
  ]),
  topologyTree: PropTypes.object,
  topologyMap: PropTypes.object,
  selection: PropTypes.string,
  sizeLimit: PropTypes.number, // Maximum number of atoms before a prompt is shown.
  onFullscreen: PropTypes.func
}

StructureNGL.defaultProps = {
  sizeLimit: 40000
}

export default withErrorHandler('Could not load structure.')(StructureNGL)

/**
 * Returns a quaternion that aligns the view according to the given input
 * options.
 *
 * @param {*} alignments: List of at most two alignments to set.  E.g. [['up',
 *   'c'], ['right', 'b']] will align the c-vector (see 'directions') to point
 *   up, and the b-vector to point right. These are applied sequentially.
 * @param {*} directions: Object containing a mapping between direction names
 * and the unit vectors that the correspond to.
 * @returns
 */
function getAlignment(alignments, directions) {
    // Check alignment validity
    if (alignments === undefined) return
    if (alignments.length > 2) throw Error('At most two alignments can be performed.')

    const finalQuaternion = new THREE.Quaternion()
    finalQuaternion.identity()
    const alignedDirections = []
    const rotate = (alignment) => {
      const direction = alignment[0]
      const target = alignment[1]
      const targetMap = {
        up: new THREE.Vector3(0, 1, 0),
        down: new THREE.Vector3(0, -1, 0),
        right: new THREE.Vector3(-1, 0, 0),
        left: new THREE.Vector3(1, 0, 0),
        front: new THREE.Vector3(0, 0, -1),
        back: new THREE.Vector3(0, 0, 1)
      }
      const targetVector = targetMap[direction]

      // Determine the top direction
      const finalVector = directions[target]
      for (const alignedDirection of alignedDirections) {
        finalVector[alignedDirection] = 0
      }

      // Rotate the scene according to the selected top direction
      if (finalVector.length() > 1e-8) {
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
            finalVector.clone().normalize(),
            targetVector.clone().normalize()
        )
        finalQuaternion.premultiply(quaternion)

        // Rotate the given directions so that their direction will be correct
        // for the next aligment
        for (const dir in directions) {
            directions[dir].clone().applyQuaternion(quaternion)
        }

        if (direction === "right" || direction === "left") {
            alignedDirections.push("x")
        } else if (direction === "up" || direction === "down") {
            alignedDirections.push("y")
        } else if (direction === "front" || direction === "back") {
            alignedDirections.push("z")
        }
      }
    }

    // Apply the alignments
    for (const alignment of alignments) {
        rotate(alignment)
    }
    return finalQuaternion
}

/**
 * Creates outlines for a cell specified by the given basis vectors.
 *
 * @param origin - The origin position for the cell
 * @param basis - The cell basis vectors
 * @param collapsed - Whether a basis vector is collapsed (length = 0)
 * @param periodicity - Periodicity of the cell as three boolean, one for each basis vector
 * @param color - Color for the cell wireframe
 * @param linewidth - Cell wireframe line width
 * @param dashSize - Cell wireframe dash size. Defaults to 0. Provide a value >
 *   0 for a dashed line.
 * @param gapSize - Cell wireframe dash size. Defaults to 0. Provide a value >
 *   0 for a dashed line.
 */
function createCell(origin, basis, collapsed, periodicity, color, linewidth, dashSize, gapSize) {
    const cell = new THREE.Object3D()
    let lineMaterial
    if (!(dashSize === 0 && gapSize === 0)) {
        lineMaterial = new THREE.LineDashedMaterial({
            color: color,
            linewidth: linewidth,
            dashSize: dashSize,
            gapSize: gapSize
        })
    } else {
        lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            linewidth: linewidth
        })
    }

    function addEdge(points, isDim, isCollapsed) {
        if (!(isDim && isCollapsed)) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
            const line = new THREE.Line(lineGeometry, lineMaterial)
            cell.add(line)
            line.computeLineDistances()
        }
    }

    for (let len = basis.length, i = 0; i < len; ++i) {
        const basisVector = basis[i]
        const isCollapsed = collapsed[i]

        // First edge
        const isDim1 = !periodicity[i]
        const points1 = [origin, basisVector.clone().add(origin)]
        addEdge(points1, isDim1, isCollapsed)

        // Second edge
        const secondIndex = (i + 1) % len
        const secondAddition = basis[secondIndex].clone()
        const isDim2 = !periodicity[i] || !periodicity[(i + 1) % 3]
        const points2 = [secondAddition.clone().add(origin), basisVector.clone().add(secondAddition).add(origin)]
        addEdge(points2, isDim2, isCollapsed)

        // Third edge
        const thirdIndex = (i + 2) % len
        const thirdAddition = basis[thirdIndex].clone()
        const isDim3 = !periodicity[i] || !periodicity[(i + 2) % 3]
        const points3 = [thirdAddition.clone().add(origin), basisVector.clone().add(thirdAddition).add(origin)]
        addEdge(points3, isDim3, isCollapsed)

        // Fourth edge
        const isDim4 = !periodicity[i] || !periodicity[(i + 2) % 3] || !periodicity[(i + 1) % 3]
        const points4 = [secondAddition.clone().add(thirdAddition).add(origin), basisVector.clone().add(secondAddition).add(thirdAddition).add(origin)]
        addEdge(points4, isDim4, isCollapsed)
    }
    return cell
}

/**
 * Visualizes the lattice constants using the given visualization options.
 *
 * @param {string} options.font Font size for lattice constants. Defaults to 0.7.
 * constants. Applied as default to all labels, can be overridden
 * individually for each lattice constant.
 * @param {string} options.color Font color for lattice constants. Applied
 * as default to all labels, can be overridden individually for each lattice
 * constant. Defaults to
 * @param {string} options.stroke.color Font stroke color
 *   for lattice constants. Defaults to "#000". Applied as default to all
 *   labels, can be overridden individually for each lattice constant.
 * @param {string} options.stroke.width Font stroke width
 *   for lattice constants. Defaults to "#000". Applied as default to all
 *   labels, can be overridden individually for each lattice constant.
 * @param {string} options.a.enabled Whether to display this lattice
 *   contant. Defaults to true.
 * @param {string} options.a.color Font color. Defaults to "#C52929".
 * @param {string} options.a.font Font family. Defaults to "Arial".
 * @param {number} options.a.size Font size. Defaults to 0.7.
 * @param {number} options.a.label The label to display. Defaults to "a".
 * @param {number} options.a.stroke.width Font stroke width. Defaults to 0.06.
 * @param {string} options.a.stroke.color Font stroke color. Defaults to "#000".
 * @param {string} options.b.enabled Whether to display this lattice
 *   contant. Defaults to true.
 * @param {string} options.b.color Font color. Defaults to "#47A823".
 * @param {string} options.b.font Font family. Defaults to "Arial".
 * @param {number} options.b.size Font size. Defaults to 0.7.
 * @param {number} options.b.label The label to display. Defaults to "b".
 * @param {number} options.b.stroke.width Font stroke width. Defaults to 0.06.
 * @param {string} options.b.stroke.color Font stroke color. Defaults to "#000".
 * @param {string} options.c.enabled Whether to display this lattice
 *   contant. Defaults to true.
 * @param {string} options.c.color Font color. Defaults to "#3B5796".
 * @param {string} options.c.font Font family. Defaults to "Arial".
 * @param {number} options.c.size Font size. Defaults to 0.7.
 * @param {number} options.c.label The label to display. Defaults to "c".
 * @param {number} options.c.stroke.width Font stroke width. Defaults to 0.06.
 * @param {string} options.c.stroke.color Font stroke color. Defaults to "#000".
 * @param {string} options.alpha.enabled Whether to display this lattice
 *   contant. Defaults to true.
 * @param {string} options.alpha.color Font color. Defaults to "#ffffff".
 * @param {string} options.alpha.font Font family. Defaults to "Arial".
 * @param {number} options.alpha.size Font size. Defaults to 0.7.
 * @param {number} options.alpha.label The label to display. Defaults to "α".
 * @param {number} options.alpha.stroke.width Font stroke width. Defaults to 0.06.
 * @param {string} options.alpha.stroke.color Font stroke color. Defaults to "#000".
 * @param {string} options.beta.enabled Whether to display this lattice
 *   contant. Defaults to true.
 * @param {string} options.beta.color Font color. Defaults to "#ffffff".
 * @param {string} options.beta.font Font family. Defaults to "Arial".
 * @param {number} options.beta.size Font size. Defaults to 0.7.
 * @param {number} options.beta.label The label to display. Defaults to "β".
 * @param {number} options.beta.stroke.width Font stroke width. Defaults to 0.06.
 * @param {string} options.beta.stroke.color Font stroke color. Defaults to "#000".
 * @param {string} options.gamma.enabled Whether to display this lattice
 *   contant. Defaults to true.
 * @param {string} options.gamma.color Font color. Defaults to "#ffffff".
 * @param {string} options.gamma.font Font family. Defaults to "Arial".
 * @param {number} options.gamma.size Font size. Defaults to 0.7.
 * @param {number} options.gamma.label The label to display. Defaults to "γ".
 * @param {number} options.gamma.stroke.width Font stroke width. Defaults to 0.06.
 * @param {string} options.gamma.stroke.color Font stroke color. Defaults to "#000".
 */
function createLatticeConstants(basis, periodicity, collapsed, options) {
  // Delete old instance
  const latticeConstants = new THREE.Group()
  const opt = options

  // Determine the periodicity and setup the visualization accordingly
  const periodicIndices = []
  for (let dim = 0; dim < 3; ++dim) {
      const p1 = periodicity[dim]
      const p2 = periodicity[(dim + 1) % 3]
      const p3 = periodicity[(dim + 2) % 3]
      if (p1 && !p2 && !p3) {
          periodicIndices.push(dim)
          break
      } else if (p1 && p2 && !p3) {
          periodicIndices.push(dim)
          periodicIndices.push((dim + 1) % 3)
          break
      }
  }

  // Create new instances
  const infoColor = 0x000000
  const axisOffset = 1.3

  let iBasis = -1
  const cellBasisColors = []
  cellBasisColors.push(opt.a.color)
  cellBasisColors.push(opt.b.color)
  cellBasisColors.push(opt.c.color)
  const angleColors = []
  angleColors.push(opt.alpha.color)
  angleColors.push(opt.beta.color)
  angleColors.push(opt.gamma.color)
  const angleStrokeColors = []
  angleStrokeColors.push(opt.alpha?.stroke?.color === undefined ? opt.stroke.color : opt.alpha.stroke.color)
  angleStrokeColors.push(opt.beta?.stroke?.color === undefined ? opt.stroke.color : opt.beta.stroke.color)
  angleStrokeColors.push(opt.gamma?.stroke?.color === undefined ? opt.stroke.color : opt.gamma.stroke.color)
  const angleStrokeWidths = []
  angleStrokeWidths.push(opt.alpha?.stroke?.width === undefined ? opt.stroke.width : opt.alpha.stroke.width)
  angleStrokeWidths.push(opt.beta?.stroke?.width === undefined ? opt.stroke.width : opt.beta.stroke.width)
  angleStrokeWidths.push(opt.gamma?.stroke?.width === undefined ? opt.stroke.width : opt.gamma.stroke.width)
  const angleLabels = [opt.gamma.label, opt.alpha.label, opt.beta.label]
  const axisLabels = [opt.a.label, opt.b.label, opt.c.label]
  const angleEnableds = [opt.gamma.enabled, opt.alpha.enabled, opt.beta.enabled]
  const axisEnableds = [opt.a.enabled, opt.b.enabled, opt.c.enabled]
  const axisFonts = []
  axisFonts.push(opt.a.font === undefined ? opt.font : opt.a.font)
  axisFonts.push(opt.b.font === undefined ? opt.font : opt.b.font)
  axisFonts.push(opt.c.font === undefined ? opt.font : opt.c.font)
  const axisFontSizes = []
  axisFontSizes.push(opt.a.size === undefined ? opt.size : opt.a.size)
  axisFontSizes.push(opt.b.size === undefined ? opt.size : opt.b.size)
  axisFontSizes.push(opt.c.size === undefined ? opt.size : opt.c.size)
  const strokeColors = []
  strokeColors.push(opt.a?.stroke?.color === undefined ? opt.stroke.color : opt.a.stroke.color)
  strokeColors.push(opt.b?.stroke?.color === undefined ? opt.stroke.color : opt.b.stroke.color)
  strokeColors.push(opt.c?.stroke?.color === undefined ? opt.stroke.color : opt.c.stroke.color)
  const strokeWidths = []
  strokeWidths.push(opt.a?.stroke?.width === undefined ? opt.stroke.width : opt.a.stroke.width)
  strokeWidths.push(opt.b?.stroke?.width === undefined ? opt.stroke.width : opt.b.stroke.width)
  strokeWidths.push(opt.c?.stroke?.width === undefined ? opt.stroke.width : opt.c.stroke.width)
  const angleFonts = []
  angleFonts.push(opt.alpha.font === undefined ? opt.font : opt.alpha.font)
  angleFonts.push(opt.beta.font === undefined ? opt.font : opt.beta.font)
  angleFonts.push(opt.gamma.font === undefined ? opt.font : opt.gamma.font)
  const angleFontSizes = []
  angleFontSizes.push(opt.alpha.size === undefined ? opt.size : opt.alpha.size)
  angleFontSizes.push(opt.beta.size === undefined ? opt.size : opt.beta.size)
  angleFontSizes.push(opt.gamma.size === undefined ? opt.size : opt.gamma.size)

  // If 2D periodic, we save the periodic indices, and ensure a right
  // handed coordinate system.
  for (let iTrueBasis = 0; iTrueBasis < 3; ++iTrueBasis) {
    iBasis += 1
    const axisLabel = axisLabels[iBasis]
    const axisColor = cellBasisColors[iBasis]
    const axisFont = axisFonts[iBasis]
    const axisFontSize = axisFontSizes[iBasis]
    const angleFontSize = angleFontSizes[iBasis]
    const strokeWidth = strokeWidths[iBasis]
    const strokeColor = strokeColors[iBasis]
    const angleFont = angleFonts[iBasis]
    const angleColor = angleColors[iBasis]
    const angleLabel = angleLabels[iBasis]
    const angleStrokeColor = angleStrokeColors[iBasis]
    const angleStrokeWidth = angleStrokeWidths[iBasis]
    const axisEnabled = axisEnableds[iBasis]
    const angleEnabled = angleEnableds[iBasis]
    const collapsed1 = collapsed[iTrueBasis]
    const collapsed2 = collapsed[(iTrueBasis + 1) % 3]
    const collapsed3 = collapsed[(iTrueBasis + 2) % 3]
    const basisVec1 = basis[iTrueBasis]
    const basisVec2 = basis[(iTrueBasis + 1) % 3].clone()
    const basisVec3 = basis[(iTrueBasis + 2) % 3].clone()

    // Basis and angle label selection, same for all systems
    if (axisEnabled && !collapsed1) {
      const origin = new THREE.Vector3(0, 0, 0)
      const dir = basisVec1.clone()

      // Add an axis label
      const textPos = dir.clone()
          .multiplyScalar(0.5)
      let labelOffset
      let newBasis
      if (collapsed2 && collapsed3) {
          newBasis = new THREE.Vector3(0, 0, 1)
          labelOffset = new THREE.Vector3().crossVectors(basisVec1, newBasis)
      } else if (collapsed2) {
          newBasis = new THREE.Vector3().crossVectors(basisVec1, basisVec3)
          labelOffset = new THREE.Vector3().crossVectors(basisVec1, newBasis)
      } else if (collapsed3) {
          newBasis = new THREE.Vector3().crossVectors(basisVec1, basisVec2)
          labelOffset = new THREE.Vector3().crossVectors(basisVec1, newBasis)
      } else {
          const labelOffset1 = new THREE.Vector3().crossVectors(basisVec1, basisVec2)
          const labelOffset2 = new THREE.Vector3().crossVectors(basisVec1, basisVec3)
          labelOffset = new THREE.Vector3().sub(labelOffset1).add(labelOffset2)
      }
      labelOffset.normalize()
      labelOffset.multiplyScalar(0.8)
      textPos.add(labelOffset)

      const axisLabelSprite = createLabel(
          textPos,
          axisLabel,
          axisColor,
          axisFont,
          axisFontSize,
          new THREE.Vector2(0.0, 0.0),
          strokeWidth,
          strokeColor
      )
      latticeConstants.add(axisLabelSprite)
      axisLabels.push(axisLabelSprite)

      // Add basis vector colored line
      const cellVectorMaterial = new THREE.MeshBasicMaterial({
          color: axisColor,
          transparent: true,
          opacity: 0.75
      })
      const cellVector = basisVec1.clone()
      const cellVectorLine = createCylinder(origin.clone(), cellVector.clone().add(origin), 0.09, 10, cellVectorMaterial)
      latticeConstants.add(cellVectorLine)

      // Add basis vector axis line
      const cellAxisMaterial = new THREE.MeshBasicMaterial({
          color: "#000000"
      })
      const axisStart = basis[iTrueBasis].clone()
      const axisEnd = axisStart.clone().multiplyScalar(1 + axisOffset / axisStart.length())
      const cellAxisVectorLine = createCylinder(origin.clone(), axisEnd, 0.02, 10, cellAxisMaterial)
      latticeConstants.add(cellAxisVectorLine)

      // Add axis arrow
      const arrowGeometry = new THREE.CylinderGeometry(0, 0.10, 0.5, 12)
      const arrowMaterial = new THREE.MeshBasicMaterial({
          color: infoColor
      })
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial)
      arrow.position.copy(dir)
          .multiplyScalar(1 + axisOffset / dir.length())
      arrow.lookAt(new THREE.Vector3())
      arrow.rotateX(-Math.PI / 2)
      latticeConstants.add(arrow)
    }

    // Add angle label and curve
    if (angleEnabled && !collapsed1 && !collapsed2) {
      const arcMaterial = new THREE.LineDashedMaterial({
          color: infoColor,
          linewidth: 2,
          dashSize: 0.2,
          gapSize: 0.1
      })

      const normal = new THREE.Vector3().crossVectors(basisVec1, basisVec2)
      const angle = basisVec1.angleTo(basisVec2)
      const maxRadius = 5
      const minRadius = 1
      const radius = Math.max(
        Math.min(1 / 6 * basisVec1.length(), 1 / 6 * basisVec2.length(), maxRadius),
        minRadius
      )
      const curve = new THREE.EllipseCurve(
          0, 0, // ax, aY
          radius, radius, // xRadius, yRadius
          0, angle, // aStartAngle, aEndAngle
          false, // aClockwise
          0 // aRotation
      )
      const nArcPoints = 20
      const points = curve.getSpacedPoints(nArcPoints)
      const arcGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const arc = new THREE.Line(arcGeometry, arcMaterial)
      arc.computeLineDistances()

      // First rotate the arc so that it's x-axis points towards the
      // first basis vector that defines the arc
      const xAxis = new THREE.Vector3(1, 0, 0)
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
          xAxis,
          basisVec1.clone().normalize()
      )
      arc.quaternion.copy(quaternion)

      // Then rotate the arc along it's x axis so that the xy-plane
      // coincides with the plane defined by the the two basis vectors
      // that define the plane.
      const verticesArray = arcGeometry.attributes.position.array
      const nVertices = verticesArray.length / 3
      const lastArcPointLocal = new THREE.Vector3().fromArray(verticesArray, (nVertices - 1) * 3)
      arc.updateMatrixWorld() // The positions are not otherwise updated properly
      const lastArcPointWorld = arc.localToWorld(lastArcPointLocal.clone())

      // The angle direction is defined by the first basis vector
      const axis = basisVec1
      const arcNormal = new THREE.Vector3()
          .crossVectors(axis, lastArcPointWorld)
      let planeAngle = normal.angleTo(arcNormal)
      const planeCross = new THREE.Vector3()
          .crossVectors(basisVec2, lastArcPointWorld)
      const directionValue = planeCross.dot(axis)
      if (directionValue > 0) {
          planeAngle = -planeAngle
      }
      arc.rotateX(planeAngle)

      // Add label for the angle
      arc.updateMatrixWorld() // The positions are not otherwise updated properly
      arc.updateMatrix() // The positions are not otherwise updated properly
      const angleLabelPos = arc.localToWorld(new THREE.Vector3().fromArray(verticesArray, (nArcPoints / 2 - 1) * 3))
      const angleLabelLen = angleLabelPos.length()
      angleLabelPos.multiplyScalar(1 + 0.3 / angleLabelLen)
      const angleLabelObj = createLabel(
          angleLabelPos,
          angleLabel.toString(),
          angleColor,
          angleFont,
          angleFontSize,
          new THREE.Vector2(0.0, 0.0),
          angleStrokeWidth,
          angleStrokeColor
      )
      latticeConstants.add(angleLabelObj)
      latticeConstants.add(arc)
    }
  }
  return latticeConstants
}

/**
 * Helper function for creating a text sprite that lives in 3D space.
 *
 * @param pos1 - Start position
 * @param pos2 - End position
 * @param radius - Cylinder radius
 * @param material - Cylinder material
 */
function createLabel(
  position,
  label,
  color,
  fontFamily,
  fontSize,
  offset = undefined,
  strokeWidth = 0,
  strokeColor = "#000"
) {
  const canvas = document.createElement('canvas')
  const size = 256
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Draw label
  const fontFactor = 0.90
  ctx.fillStyle = color
  ctx.font = `${fontFactor * size}px ${fontFamily}`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  if (strokeWidth > 0) {
      ctx.lineWidth = strokeWidth * size
      ctx.strokeStyle = strokeColor
      ctx.strokeText(label, size / 2, size / 2)
  }
  ctx.fillText(label, size / 2, size / 2)

  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(fontSize, fontSize, 1)

  // Apply offset
  if (offset === undefined) {
      offset = new THREE.Vector2(0, 0)
  }
  const trueOffset = new THREE.Vector2()
  trueOffset.addVectors(offset, new THREE.Vector2(0.5, 0.5))
  sprite.center.copy(trueOffset)

  const labelRoot = new THREE.Object3D()
  labelRoot.position.copy(position)
  labelRoot.add(sprite)

  return labelRoot
}

/**
 * Helper function for creating a cylinder mesh.
 *
 * @param pos1 - Start position
 * @param pos2 - End position
 * @param radius - Cylinder radius
 * @param material - Cylinder material
 */
function createCylinder(pos1, pos2, radius, nSegments, material) {
  const direction = new THREE.Vector3().subVectors(pos2, pos1)
  const dirLen = direction.length()
  const dirNorm = direction.clone().divideScalar(dirLen)
  const arrow = new THREE.ArrowHelper(dirNorm, pos1)
  const edgeGeometry = new THREE.CylinderGeometry(radius, radius, dirLen, nSegments)
  const edge = new THREE.Mesh(edgeGeometry, material)
  edge.rotation.copy(arrow.rotation.clone())
  edge.position.copy(new THREE.Vector3().addVectors(pos1, direction.multiplyScalar(0.5)))

  return edge
}

/**
 * Used to add custom three.js objects to an NGL stage. Note that this adds the
 * object to an item inside 'modelGroup'. This is the easiest way to attach the
 * objects to a group with the correct translations and rotations, but may break
 * if the first item is not a group.
 *
 * @param object - The object to add. Can be any object that inherits from Object3D.
 * @param stage - The NGL Stage to add the object into.
 * @param obects - List of custom objects into which the given one is added.
 */
function addObject3DToStage(object, stage) {
  const scene = stage.viewer.scene
  const rotationGroup = scene.getObjectByName('rotationGroup')
  const translationGroup = rotationGroup.getObjectByName('translationGroup')
  const pickingGroup = translationGroup.getObjectByName('modelGroup')
  // TODO: Since we don't know the actual three.js Object3Ds that correspond to
  // each component, we are simply adding the object to the latest model object
  // that is found and is visible by default.
  const group = pickingGroup.children[pickingGroup.children.length - 2]
  group.add(object)
}

/**
 * For wrapping and unwrapping atom positions.
 *
 * @param {ngl.Component} component The ngl component to wrap
 * @param {bool} wrap Whether to use wrapped coordinates.
 */
function wrapPositions(component, wrap) {
  let posNew
  const basis = component.basis
  const unitCell = component.object.unitcell
  const pbc = component.pbc

  if (!basis) return
  if (!pbc.some(a => a)) return

  // Gather and store the original cartesian positions if they are not already
  // resolved.
  if (isNil(component.posCart)) {
    component.posCart = []
    component.structure.eachAtom(ap => {
      component.posCart.push(ap.positionToVector3(new THREE.Vector3()))
    })
  }

  // Create wrapped positions
  if (wrap) {
    if (!isNil(component.posWrap)) {
      posNew = component.posWrap
    } else {
      posNew = component.posCart.map(pos => {
        return pos.clone().applyMatrix4(unitCell.cartToFrac)
      })
      const eps = 1e-2
      const epsArray = new THREE.Vector3(eps, eps, eps).applyMatrix4(unitCell.cartToFrac).toArray()
      const center = [0.5, 0.5, 0.5] // Positions will be nearest to this location
      const shift = center.map((center, i) => pbc[i] ? center - 0.5 - epsArray[i] : 0)
      for (let len = posNew.length, i = 0; i < len; ++i) {
        const iFracPos = posNew[i]
        for (let i = 0; i < 3; ++i) {
          if (!pbc[i]) continue
          const comp = iFracPos.getComponent(i)
          let remainder = ((comp - shift[i]) % 1) + shift[i]
          // Unlike in python, remainder in javascript can be negative
          if (remainder < -epsArray[i]) remainder += 1
          iFracPos.setComponent(i, remainder)
        }
      }
      posNew = posNew.map(pos => pos.applyMatrix4(unitCell.fracToCart))
      component.posWrap = posNew
    }
  // Use original cartesian positions
  } else {
    posNew = component.posCart
  }

  // Set new positions within the structure data. This follows roughly the
  // Structure.updatePosition()-function in NGL.
  let i = 0
  component.structure.eachAtom((ap) => {
    ap.positionFromVector3(posNew[i])
    ++i
  })
  component.structure._hasCoords = undefined
  component.structure.refreshPosition()
  // This updates the actual visuals. TODO: not sure why this is producing an
  // exception, ignored for now.
  try {
    component.updateRepresentations()
  } catch {
  }
}

// This data is copied directly from NGL as it cannot be imported directly.
const atomicNumbers = {
  H: 1, D: 1, T: 1, HE: 2, LI: 3, BE: 4, B: 5, C: 6, N: 7, O: 8, F: 9, NE: 10, NA: 11, MG: 12, AL: 13, SI: 14, P: 15, S: 16, CL: 17, AR: 18, K: 19, CA: 20, SC: 21, TI: 22, V: 23, CR: 24, MN: 25, FE: 26, CO: 27, NI: 28, CU: 29, ZN: 30, GA: 31, GE: 32, AS: 33, SE: 34, BR: 35, KR: 36, RB: 37, SR: 38, Y: 39, ZR: 40, NB: 41, MO: 42, TC: 43, RU: 44, RH: 45, PD: 46, AG: 47, CD: 48, IN: 49, SN: 50, SB: 51, TE: 52, I: 53, XE: 54, CS: 55, BA: 56, LA: 57, CE: 58, PR: 59, ND: 60, PM: 61, SM: 62, EU: 63, GD: 64, TB: 65, DY: 66, HO: 67, ER: 68, TM: 69, YB: 70, LU: 71, HF: 72, TA: 73, W: 74, RE: 75, OS: 76, IR: 77, PT: 78, AU: 79, HG: 80, TL: 81, PB: 82, BI: 83, PO: 84, AT: 85, RN: 86, FR: 87, RA: 88, AC: 89, TH: 90, PA: 91, U: 92, NP: 93, PU: 94, AM: 95, CM: 96, BK: 97, CF: 98, ES: 99, FM: 100, MD: 101, NO: 102, LR: 103, RF: 104, DB: 105, SG: 106, BH: 107, HS: 108, MT: 109, DS: 110, RG: 111, CN: 112, NH: 113, FL: 114, MC: 115, LV: 116, TS: 117, OG: 118
}
const vdwRadii = {
  1: 1.1, 2: 1.4, 3: 1.81, 4: 1.53, 5: 1.92, 6: 1.7, 7: 1.55, 8: 1.52, 9: 1.47, 10: 1.54, 11: 2.27, 12: 1.73, 13: 1.84, 14: 2.1, 15: 1.8, 16: 1.8, 17: 1.75, 18: 1.88, 19: 2.75, 20: 2.31, 21: 2.3, 22: 2.15, 23: 2.05, 24: 2.05, 25: 2.05, 26: 2.05, 27: 2.0, 28: 2.0, 29: 2.0, 30: 2.1, 31: 1.87, 32: 2.11, 33: 1.85, 34: 1.9, 35: 1.83, 36: 2.02, 37: 3.03, 38: 2.49, 39: 2.4, 40: 2.3, 41: 2.15, 42: 2.1, 43: 2.05, 44: 2.05, 45: 2.0, 46: 2.05, 47: 2.1, 48: 2.2, 49: 2.2, 50: 1.93, 51: 2.17, 52: 2.06, 53: 1.98, 54: 2.16, 55: 3.43, 56: 2.68, 57: 2.5, 58: 2.48, 59: 2.47, 60: 2.45, 61: 2.43, 62: 2.42, 63: 2.4, 64: 2.38, 65: 2.37, 66: 2.35, 67: 2.33, 68: 2.32, 69: 2.3, 70: 2.28, 71: 2.27, 72: 2.25, 73: 2.2, 74: 2.1, 75: 2.05, 76: 2.0, 77: 2.0, 78: 2.05, 79: 2.1, 80: 2.05, 81: 1.96, 82: 2.02, 83: 2.07, 84: 1.97, 85: 2.02, 86: 2.2, 87: 3.48, 88: 2.83, 89: 2.0, 90: 2.4, 91: 2.0, 92: 2.3, 93: 2.0, 94: 2.0, 95: 2.0, 96: 2.0, 97: 2.0, 98: 2.0, 99: 2.0, 100: 2.0, 101: 2.0, 102: 2.0, 103: 2.0, 104: 2.0, 105: 2.0, 106: 2.0, 107: 2.0, 108: 2.0, 109: 2.0, 110: 2.0, 111: 2.0, 112: 2.0, 113: 2.0, 114: 2.0, 115: 2.0, 116: 2.0, 117: 2.0, 118: 2.0
}
const elementColors = {
  'H': 0xFFFFFF, 'HE': 0xD9FFFF, 'LI': 0xCC80FF, 'BE': 0xC2FF00, 'B': 0xFFB5B5, 'C': 0x909090, 'N': 0x3050F8, 'O': 0xFF0D0D, 'F': 0x90E050, 'NE': 0xB3E3F5, 'NA': 0xAB5CF2, 'MG': 0x8AFF00, 'AL': 0xBFA6A6, 'SI': 0xF0C8A0, 'P': 0xFF8000, 'S': 0xFFFF30, 'CL': 0x1FF01F, 'AR': 0x80D1E3, 'K': 0x8F40D4, 'CA': 0x3DFF00, 'SC': 0xE6E6E6, 'TI': 0xBFC2C7, 'V': 0xA6A6AB, 'CR': 0x8A99C7, 'MN': 0x9C7AC7, 'FE': 0xE06633, 'CO': 0xF090A0, 'NI': 0x50D050, 'CU': 0xC88033, 'ZN': 0x7D80B0, 'GA': 0xC28F8F, 'GE': 0x668F8F, 'AS': 0xBD80E3, 'SE': 0xFFA100, 'BR': 0xA62929, 'KR': 0x5CB8D1, 'RB': 0x702EB0, 'SR': 0x00FF00, 'Y': 0x94FFFF, 'ZR': 0x94E0E0, 'NB': 0x73C2C9, 'MO': 0x54B5B5, 'TC': 0x3B9E9E, 'RU': 0x248F8F, 'RH': 0x0A7D8C, 'PD': 0x006985, 'AG': 0xC0C0C0, 'CD': 0xFFD98F, 'IN': 0xA67573, 'SN': 0x668080, 'SB': 0x9E63B5, 'TE': 0xD47A00, 'I': 0x940094, 'XE': 0x940094, 'CS': 0x57178F, 'BA': 0x00C900, 'LA': 0x70D4FF, 'CE': 0xFFFFC7, 'PR': 0xD9FFC7, 'ND': 0xC7FFC7, 'PM': 0xA3FFC7, 'SM': 0x8FFFC7, 'EU': 0x61FFC7, 'GD': 0x45FFC7, 'TB': 0x30FFC7, 'DY': 0x1FFFC7, 'HO': 0x00FF9C, 'ER': 0x00E675, 'TM': 0x00D452, 'YB': 0x00BF38, 'LU': 0x00AB24, 'HF': 0x4DC2FF, 'TA': 0x4DA6FF, 'W': 0x2194D6, 'RE': 0x267DAB, 'OS': 0x266696, 'IR': 0x175487, 'PT': 0xD0D0E0, 'AU': 0xFFD123, 'HG': 0xB8B8D0, 'TL': 0xA6544D, 'PB': 0x575961, 'BI': 0x9E4FB5, 'PO': 0xAB5C00, 'AT': 0x754F45, 'RN': 0x428296, 'FR': 0x420066, 'RA': 0x007D00, 'AC': 0x70ABFA, 'TH': 0x00BAFF, 'PA': 0x00A1FF, 'U': 0x008FFF, 'NP': 0x0080FF, 'PU': 0x006BFF, 'AM': 0x545CF2, 'CM': 0x785CE3, 'BK': 0x8A4FE3, 'CF': 0xA136D4, 'ES': 0xB31FD4, 'FM': 0xB31FBA, 'MD': 0xB30DA6, 'NO': 0xBD0D87, 'LR': 0xC70066, 'RF': 0xCC0059, 'DB': 0xD1004F, 'SG': 0xD90045, 'BH': 0xE00038, 'HS': 0xE6002E, 'MT': 0xEB0026, 'DS': 0xFFFFFF, 'RG': 0xFFFFFF, 'CN': 0xFFFFFF, 'UUT': 0xFFFFFF, 'FL': 0xFFFFFF, 'UUP': 0xFFFFFF, 'LV': 0xFFFFFF, 'UUH': 0xFFFFFF, 'D': 0xFFFFC0, 'T': 0xFFFFA0
}
