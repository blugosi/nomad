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

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { FilterSubMenu, filterMenuContext } from './FilterMenu'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@material-ui/core'
import { InputGrid, InputGridItem } from '../input/InputGrid'
import { useApi } from '../../api'
import { useErrors } from '../../errors'
import { useSearchContext } from '../SearchContext'
import { useGlobalMetainfo } from '../../archive/metainfo'
import { NumberEditQuantity } from '../../editQuantity/NumberEditQuantity'
import { StringEditQuantity } from '../../editQuantity/StringEditQuantity'
import { EnumEditQuantity } from '../../editQuantity/EnumEditQuantity'
import { DateTimeEditQuantity } from '../../editQuantity/DateTimeEditQuantity'
import { editQuantityComponents } from '../../editQuantity/EditQuantity'
import { InputMetainfo } from '../../search/input/InputText'
import { DType, getDatatype } from '../../../utils'

const types = {
  str: 'String',
  float: 'Float',
  float64: 'Float',
  int32: 'Integer',
  int: 'Integer',
  'nomad.metainfo.metainfo._Datetime': 'Datetime'
}

const operators = {
  'search': '=',
  'lt': '<',
  'lte': '<=',
  'gte': '=>',
  'gt': '>'
}

const typeOperators = {
  [DType.Int]: Object.keys(operators),
  [DType.Float]: Object.keys(operators),
  [DType.Timestamp]: Object.keys(operators),
  [DType.String]: ['search'],
  [DType.Enum]: ['search']
}

const valueKeys = {
  [DType.Int]: 'long_value',
  [DType.Float]: 'double_value',
  [DType.Timestamp]: 'date_value',
  [DType.String]: 'text_value',
  [DType.Enum]: 'keyword_value'
}

const getValueKey = (quantityDef) => {
  const dtype = getDatatype(quantityDef)
  const result = valueKeys[dtype]

  if (!result) {
    throw Error('Unsupported quantity type')
  }
  return result
}

const getOperators = (quantityDef) => {
  const dtype = getDatatype(quantityDef)
  const result = typeOperators[dtype]
  if (!result) {
    throw Error('Unsupported quantity type')
  }
  return result
}

const EditQuantity = React.memo(({quantityDef, value, onChange}) => {
  const [component, componentProps] = useMemo(() => {
    const elnAnnotation = quantityDef.m_annotations?.eln[0] || {}
    let {component, props, ...otherProps} = elnAnnotation
    component = component && editQuantityComponents[component]
    const usesCompatibleComponent = [StringEditQuantity, EnumEditQuantity, NumberEditQuantity, DateTimeEditQuantity].indexOf(component) !== -1

    if (!(component && usesCompatibleComponent)) {
      const {type_kind, type_data} = quantityDef.type
      if (type_data === 'str') {
        component = StringEditQuantity
      } else if (type_kind === 'Enum') {
        component = EnumEditQuantity
      } else if (type_data === 'float' || type_data === 'np.float64') {
        component = NumberEditQuantity
      } else if (type_data === 'int' || type_data === 'np.int32') {
        component = NumberEditQuantity
      } else if (type_data === 'nomad.metainfo.metainfo._Datetime') {
        component = DateTimeEditQuantity
      }
      props = {}
      otherProps = {}
    }

    return [component, {
      ...props,
      ...otherProps,
      label: 'value',
      quantityDef: quantityDef
    }]
  }, [quantityDef])

  return React.createElement(
    component, {
      ...componentProps,
      value: value,
      onChange: onChange
  })
})
EditQuantity.propTypes = {
  quantityDef: PropTypes.object.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

const QuantityFilter = React.memo(({quantities, filter, onChange}) => {
  const {path, value} = filter
  const operator = filter.operator || 'search'
  const quantityDef = useMemo(() => {
    return quantities.find(q => q.path === path)?._quantityDef
  }, [path, quantities])

  const options = useMemo(() => {
    return quantities.map(quantity => ({
      path: quantity.path,
      secondary: quantity._description,
      description: quantity?._quantityDef?.description
    }))
  }, [quantities])

  const handleValueChange = useCallback((value) => {
    onChange({
      operator: 'search',
      ...filter,
      value: value
    })
  }, [filter, onChange])

  const handlePathChange = useCallback((value) => {
    onChange({
      operator: 'search',
      path: value
    })
  }, [onChange])

  const handleOperatorChange = useCallback((e) => {
    onChange({
      ...filter,
      operator: e.target.value
    })
  }, [filter, onChange])

  const availableOperators = quantityDef ? getOperators(quantityDef) : ['search']

  return (<React.Fragment>
    <Box display="flex" flexWrap="wrap" flexDirection="row" alignItems="flex-start" marginTop={1}>
      <Box marginBottom={1} width="100%">
        <InputMetainfo
          options={options}
          value={path}
          onChange={handlePathChange}
          onSelect={handlePathChange}
          // TODO: There should be better error handling here. Errors for now
          // simply clear out the input.
          onError={(error) => error && handlePathChange("")}
          optional
        />
      </Box>
      <Box marginRight={1} width={65}>
        <FormControl fullWidth size="small" variant="filled">
          <InputLabel>op</InputLabel>
          <Select
            value={operator}
            onChange={handleOperatorChange}
            renderValue={value => <b>{operators[value]}</b>}
          >
            {availableOperators.map((operator, index) => (
              <MenuItem key={index} value={operator}>{operators[operator]}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box flexGrow={1}>
        {
          quantityDef ? (
            <EditQuantity
              fullWidth
              value={value}
              onChange={handleValueChange}
              quantityDef={quantityDef}
            />
          ) : (
            <TextField
              variant="filled" size="small" label="value" fullWidth
              value={filter.value || ''} onChange={e => handleValueChange(e.target.value)}
            />
          )
        }
      </Box>
    </Box>
  </React.Fragment>)
})
QuantityFilter.propTypes = {
  quantities: PropTypes.arrayOf(PropTypes.object).isRequired,
  filter: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

const FilterSubMenuCustomQuantities = React.memo(({
  id,
  ...rest
}) => {
  const metainfo = useGlobalMetainfo()
  const {selected, open} = useContext(filterMenuContext)
  const {useFilterState} = useSearchContext()
  const visible = open && id === selected
  const {api} = useApi()
  const {raiseError} = useErrors()
  const [query, setQuery] = useFilterState('custom_quantities')
  const [quantities, setQuantities] = useState(null)

  const [andFilters, setAndFilters] = useState([{}])

  useEffect(() => {
    if (!metainfo || !visible) {
      return
    }
    const retrieve = async () => {
      const response = await api.post('entries/query', {
        'owner': 'visible',
        'query': {
          'quantities': 'data'
        },
        'pagination': {
          'page_size': 0
        },
        'aggregations': {
          'paths': {
            'terms': {
              'quantity': 'searchable_quantities.path',
              'size': 1000,
              'entries': {
                'size': 1,
                'required': {
                  'include': [
                    'searchable_quantities.path', 'searchable_quantities.quantity_name',
                    'searchable_quantities.section_definition']
                }
              }
            }
          }
        }
      }, {
        noLoading: true
      })
      const quantities = []
      for (const path of response.aggregations.paths.terms.data) {
        const searchableQuantity = path.entries[0].searchable_quantities
        const sectionDef = await metainfo.resolveDefinition(searchableQuantity.section_definition)
        const quantityDef = sectionDef._properties[searchableQuantity.quantity_name]
        let description = types[quantityDef.type.type_data] || 'unknown type'
        if (quantityDef.type.type_kind === 'Enum') {
          description = 'Enum'
        }
        if (quantityDef.unit) {
          description += ` in ${quantityDef.unit}`
        }
        quantities.push({
          ...searchableQuantity,
          _sectionDef: sectionDef,
          _quantityDef: quantityDef,
          _description: description
        })
      }
      setQuantities(quantities)
    }
    retrieve().catch(raiseError)
  }, [visible, api, raiseError, setQuantities, metainfo])

  useEffect(() => {
    if (!visible && quantities?.length > 0) {
      setQuantities([])
    }
  }, [quantities, setQuantities, visible])

  const handleFilterChange = useCallback((filter, index) => {
    setAndFilters(filters => {
      const newFilters = [...filters]
      newFilters[index] = filter
      return newFilters
    })
  }, [setAndFilters])

  const handleAndClicked = useCallback(() => {
    setAndFilters(filters => [...filters, {}])
  }, [setAndFilters])

  const handleClearClicked = useCallback(() => {
    setAndFilters([{}])
    setQuery([])
  }, [setAndFilters, setQuery])

  const searchEnabled = useMemo(() => {
    return andFilters.every(f => f.path && f.value)
  }, [andFilters])

  const handleSearchClicked = useCallback(() => {
    const query = {
      and: andFilters.map(filter => {
        const {path, value, operator} = filter
        const quantityDef = path && quantities.find(q => q.path === path)._quantityDef
        const valueKey = getValueKey(quantityDef)
        const valueKeyWithOperator = operator === 'search' ? valueKey : `${valueKey}:${operator}`
        return {
          searchable_quantities: {
            path: path,
            [valueKeyWithOperator]: value
          }
        }
      })
    }
    setQuery(query)
  }, [andFilters, setQuery, quantities])

  useEffect(() => {
    const andFilters = query?.and?.map(filter => {
      const searchableQuantity = filter.searchable_quantities
      const valueKey = Object.keys(searchableQuantity)[1]
      const valueKeyWithOperator = valueKey.split(':')
      const operator = valueKeyWithOperator.length === 2 ? valueKeyWithOperator[1] : 'search'
      return {
        path: searchableQuantity.path,
        value: searchableQuantity[Object.keys(searchableQuantity)[1]],
        operator: operator
      }
    })
    setAndFilters(andFilters || [{}])
  }, [query, setAndFilters])

  if (!quantities) {
    return (
      <FilterSubMenu id={id} {...rest}>
        <InputGrid>
          <InputGridItem xs={12}>
            <LinearProgress/>
          </InputGridItem>
        </InputGrid>
      </FilterSubMenu>
    )
  }

  if (quantities.length === 0) {
    return (
      <FilterSubMenu id={id} {...rest}>
        <InputGrid>
          <InputGridItem xs={12}>
            <Typography>
              There are not quantities to search for. Add some data first.
            </Typography>
          </InputGridItem>
        </InputGrid>
      </FilterSubMenu>
    )
  }

  return <FilterSubMenu id={id} {...rest}>
    <InputGrid>
      <InputGridItem xs={12}>
        <Box marginTop={2}>
          {andFilters.map((filter, index) => (
            <Box key={index} marginY={1}>
              <QuantityFilter
                quantities={quantities}
                filter={filter}
                onChange={filter => handleFilterChange(filter, index)}
              />
            </Box>
          ))}
          <Box flexDirection="row" display="flex">
            <Button
              variant="contained" color="primary" onClick={handleAndClicked}
            >And</Button>
            <Box marginLeft={1}>
              <Button
                variant="contained" color="primary" onClick={handleClearClicked}
                disabled={andFilters.length === 1 && Object.keys(andFilters[0]).length === 0}
              >Clear</Button>
            </Box>
          </Box>
        </Box>
      </InputGridItem>
      <InputGridItem xs={12}>
        <Box marginTop={2} display="flex" flexDirection="row" justifyContent="right">
          <Button
            variant="contained" color="primary" onClick={handleSearchClicked}
            disabled={!searchEnabled}
          >Update search</Button>
        </Box>
      </InputGridItem>
    </InputGrid>
  </FilterSubMenu>
})
FilterSubMenuCustomQuantities.propTypes = {
  id: PropTypes.string
}

export default FilterSubMenuCustomQuantities
