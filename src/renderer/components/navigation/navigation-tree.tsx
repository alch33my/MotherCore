import React from 'react'
import { useState, useEffect } from 'react'
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, FileIcon, FileTextIcon, PlusIcon, RefreshCwIcon, InfoIcon } from 'lucide-react'
import Icon from '../ui/Icon'

interface NavigationTreeProps {
  onSelectOrganization: (item: any) => void
  onSelectProject: (item: any) => void
  onSelectBook: (item: any) => void
  onSelectChapter: (item: any) => void
  onSelectPage: (item: any) => void
  onAddOrganization: () => void
  onAddProject: (orgId: string) => void
  onAddBook: (projectId: string) => void
  onAddChapter: (bookId: string) => void
  onAddPage: (chapterId: string) => void
}

interface TreeNode {
  id: string
  name: string
  color?: string
  icon?: string
  type: 'organization' | 'project' | 'book' | 'chapter' | 'page'
  children?: TreeNode[]
  parentId?: string
  expanded?: boolean
  organization_id?: string
  project_id?: string
  book_id?: string
  chapter_id?: string
}

function NavigationTree({
  onSelectOrganization,
  onSelectProject,
  onSelectBook,
  onSelectChapter,
  onSelectPage,
  onAddOrganization,
  onAddProject,
  onAddBook,
  onAddChapter,
  onAddPage,
}: NavigationTreeProps) {
  const [organizations, setOrganizations] = useState<TreeNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [debugMode, setDebugMode] = useState(false)
  
  // Load organizations ONCE on component mount
  useEffect(() => {
    console.log("NavigationTree mounted - loading organizations ONCE")
    loadOrganizations()
    // No dependencies to ensure this only runs once
  }, [])

  // REMOVED: Auto-expand organizations effect
  
  async function loadOrganizations() {
    console.log("loadOrganizations called")
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      const result = await window.electronAPI.getOrganizations()
      console.log(`Got ${result.organizations?.length || 0} organizations:`, result)
      
      if (result.success && result.organizations) {
        const orgs = result.organizations.map((org: any) => ({
          id: org.id,
          name: org.name,
          color: org.color,
          icon: org.icon,
          type: 'organization' as const,
          children: [],
          expanded: false
        }))
        
        setOrganizations(orgs)
      }
    } catch (err) {
      console.error('Failed to load organizations:', err)
      window.electronAPI?.logError(String(err))
    }
  }

  async function loadProjects(orgId: string) {
    console.log(`loadProjects called for org ${orgId}`)
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      setLoading(prev => ({ ...prev, [orgId]: true }))
      const result = await window.electronAPI.getProjects(orgId)
      console.log(`Got ${result.projects?.length || 0} projects for org ${orgId}:`, result)
      
      if (result.success && result.projects) {
        setOrganizations(prevOrgs => {
          return prevOrgs.map(org => {
            if (org.id === orgId) {
              return {
                ...org,
                children: result.projects?.map((project: any) => ({
                  id: project.id,
                  name: project.name,
                  color: project.color,
                  type: 'project' as const,
                  parentId: orgId,
                  organization_id: orgId,
                  children: [],
                  expanded: false
                })) || []
              }
            }
            return org
          })
        })
      }
    } catch (err) {
      console.error(`Failed to load projects for organization ${orgId}:`, err)
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(prev => ({ ...prev, [orgId]: false }))
    }
  }

  async function loadBooks(projectId: string, orgId: string) {
    try {
      console.log(`Loading books for project ${projectId}...`)
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      setLoading(prev => ({ ...prev, [projectId]: true }))
      const result = await window.electronAPI.getBooks(projectId)
      console.log(`Got ${result.books?.length || 0} books for project ${projectId}:`, result)
      
      if (result.success && result.books) {
        setOrganizations(prevOrgs => {
          return prevOrgs.map(org => {
            if (org.id === orgId) {
              return {
                ...org,
                children: org.children?.map(project => {
                  if (project.id === projectId) {
                    return {
                      ...project,
                      children: result.books?.map((book: any) => ({
                        id: book.id,
                        name: book.name,
                        color: book.spine_color,
                        type: 'book' as const,
                        parentId: projectId,
                        children: [],
                        expanded: false
                      })) || []
                    }
                  }
                  return project
                }) || []
              }
            }
            return org
          })
        })
      }
    } catch (err) {
      console.error(`Error loading books: ${err}`)
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(prev => ({ ...prev, [projectId]: false }))
    }
  }

  async function loadChapters(bookId: string, projectId: string, orgId: string) {
    try {
      console.log(`Loading chapters for book ${bookId}...`)
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      setLoading(prev => ({ ...prev, [bookId]: true }))
      const result = await window.electronAPI.getChapters(bookId)
      console.log(`Got ${result.chapters?.length || 0} chapters for book ${bookId}:`, result)
      
      if (result.success && result.chapters) {
        setOrganizations(prevOrgs => {
          return prevOrgs.map(org => {
            if (org.id === orgId) {
              return {
                ...org,
                children: org.children?.map(project => {
                  if (project.id === projectId) {
                    return {
                      ...project,
                      children: project.children?.map(book => {
                        if (book.id === bookId) {
                          return {
                            ...book,
                            children: result.chapters?.map((chapter: any) => ({
                              id: chapter.id,
                              name: chapter.name,
                              type: 'chapter' as const,
                              parentId: bookId,
                              children: [],
                              expanded: false
                            })) || []
                          }
                        }
                        return book
                      }) || []
                    }
                  }
                  return project
                }) || []
              }
            }
            return org
          })
        })
      }
    } catch (err) {
      console.error(`Error loading chapters: ${err}`)
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(prev => ({ ...prev, [bookId]: false }))
    }
  }

  async function loadPages(chapterId: string, bookId: string, projectId: string, orgId: string) {
    try {
      console.log(`Loading pages for chapter ${chapterId}...`)
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      setLoading(prev => ({ ...prev, [chapterId]: true }))
      const result = await window.electronAPI.getPages(chapterId)
      console.log(`Got ${result.pages?.length || 0} pages for chapter ${chapterId}:`, result)
      
      if (result.success && result.pages) {
        setOrganizations(prevOrgs => {
          return prevOrgs.map(org => {
            if (org.id === orgId) {
              return {
                ...org,
                children: org.children?.map(project => {
                  if (project.id === projectId) {
                    return {
                      ...project,
                      children: project.children?.map(book => {
                        if (book.id === bookId) {
                          return {
                            ...book,
                            children: book.children?.map(chapter => {
                              if (chapter.id === chapterId) {
                                return {
                                  ...chapter,
                                  children: result.pages?.map((page: any) => ({
                                    id: page.id,
                                    name: page.title,
                                    type: 'page' as const,
                                    parentId: chapterId
                                  })) || []
                                }
                              }
                              return chapter
                            }) || []
                          }
                        }
                        return book
                      }) || []
                    }
                  }
                  return project
                }) || []
              }
            }
            return org
          })
        })
      }
    } catch (err) {
      console.error(`Error loading pages: ${err}`)
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(prev => ({ ...prev, [chapterId]: false }))
    }
  }

  function toggleExpand(node: TreeNode, parentId?: string, grandParentId?: string, greatGrandParentId?: string) {
    const nodeId = node.id
    const isExpanded = expandedNodes[nodeId] || false
    
    console.log(`Toggling node ${node.type} ${node.name} (${nodeId}), currently expanded: ${isExpanded}`)
    console.log(`Parent context: ${parentId}, ${grandParentId}, ${greatGrandParentId}`)
    
    // Toggle the expanded state
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !isExpanded
    }))
    
    // Load children ONLY if expanding AND children are not already loaded
    if (!isExpanded) {
      const hasLoadedChildren = node.children && node.children.length > 0
      
      if (node.type === 'organization' && !hasLoadedChildren) {
        console.log(`Loading projects for org ${nodeId} (not previously loaded)`)
        loadProjects(nodeId)
      } 
      else if (node.type === 'project' && !hasLoadedChildren && parentId) {
        console.log(`Loading books for project ${nodeId} (not previously loaded)`)
        loadBooks(nodeId, parentId)
      } 
      else if (node.type === 'book' && !hasLoadedChildren && parentId && grandParentId) {
        console.log(`Loading chapters for book ${nodeId} (not previously loaded)`)
        loadChapters(nodeId, parentId, grandParentId)
      } 
      else if (node.type === 'chapter' && !hasLoadedChildren && parentId && grandParentId && greatGrandParentId) {
        console.log(`Loading pages for chapter ${nodeId} (not previously loaded)`)
        loadPages(nodeId, parentId, grandParentId, greatGrandParentId)
      }
    }
  }

  function handleSelect(node: TreeNode) {
    console.log(`Selected ${node.type} ${node.name} (${node.id})`)
    
    // Create a clean item object with only the necessary properties
    // This prevents issues with circular references or complex objects
    const item: Record<string, any> = {
      id: node.id,
      name: node.name,
      type: node.type,
      color: node.color,
      icon: node.icon
    }
    
    // Add parent references based on node type
    if (node.type === 'project' && node.parentId) {
      item.organization_id = node.parentId
    } 
    else if (node.type === 'book' && node.parentId) {
      item.project_id = node.parentId
    }
    else if (node.type === 'chapter' && node.parentId) {
      item.book_id = node.parentId
    }
    else if (node.type === 'page' && node.parentId) {
      item.chapter_id = node.parentId
    }
    
    console.log(`Clean item for selection:`, item)
    
    switch (node.type) {
      case 'organization':
        onSelectOrganization(item)
        break
      case 'project':
        onSelectProject(item)
        break
      case 'book':
        onSelectBook(item)
        break
      case 'chapter':
        onSelectChapter(item)
        break
      case 'page':
        onSelectPage(item)
        break
    }
  }

  function handleAdd(node: TreeNode) {
    console.log(`Adding to ${node.type} ${node.name} (${node.id})`)
    
    switch (node.type) {
      case 'organization':
        onAddProject(node.id)
        break
      case 'project':
        onAddBook(node.id)
        break
      case 'book':
        onAddChapter(node.id)
        break
      case 'chapter':
        onAddPage(node.id)
        break
    }
  }

  function getIcon(type: TreeNode['type'], color?: string) {
    switch (type) {
      case 'organization':
        return <FolderIcon size={16} className="text-matrix-amber" />
      case 'project':
        return <FolderIcon size={16} style={{ color: color || '#ffb000' }} />
      case 'book':
        return <Icon name="book-icon-greys" size={16} />
      case 'chapter':
        return <FileIcon size={16} className="text-matrix-gold" />
      case 'page':
        return <FileTextIcon size={16} className="text-white" />
      default:
        return <FileIcon size={16} className="text-matrix-gold" />
    }
  }

  // Add a debug refresh function that uses standard API methods
  const refreshDatabase = async () => {
    console.log("Manually refreshing database state")
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      // Just reload organizations to refresh the UI
      loadOrganizations()
    } catch (err) {
      console.error('Failed to refresh database:', err)
      window.electronAPI?.logError(String(err))
    }
  }
  
  // Simplified debug function that just logs the current state
  async function checkOrganizationProjects(orgId: string) {
    console.log(`Checking projects for organization ${orgId}`)
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      // Just load projects for this organization
      const result = await window.electronAPI.getProjects(orgId)
      console.log(`Organization ${orgId} has ${result.projects?.length || 0} projects:`, result)
    } catch (err) {
      console.error('Failed to check organization projects:', err)
      window.electronAPI?.logError(String(err))
    }
  }

  // Add a debug button to the tree node
  function renderTreeNode(node: TreeNode, parentId?: string, grandParentId?: string, greatGrandParentId?: string) {
    const isExpanded = expandedNodes[node.id] || false
    const isLoading = loading[node.id] || false
    const hasChildren = node.children && node.children.length > 0
    
    const icon = getIcon(node.type, node.color)
    
    // Calculate depth for proper indentation
    let depth = 0;
    if (greatGrandParentId) depth = 3;
    else if (grandParentId) depth = 2;
    else if (parentId) depth = 1;
    
    // Use CSS classes instead of Tailwind for proper layout
    const itemClass = `tree-item ${isExpanded ? 'expanded' : ''}`;
    const indentStyle = { paddingLeft: `${depth * 20 + 12}px` };
    
    return (
      <div key={node.id} className="tree-item-container">
        <div 
          className={itemClass}
          style={indentStyle}
        >
          {/* Chevron Icon */}
          <div 
            className="tree-item-chevron"
            onClick={() => toggleExpand(node, parentId, grandParentId, greatGrandParentId)}
          >
            {isLoading ? (
              <div className="tree-loading">
                <RefreshCwIcon size={14} />
              </div>
            ) : hasChildren || node.type !== 'page' ? (
              isExpanded ? 
                <ChevronDownIcon size={14} /> : 
                <ChevronRightIcon size={14} />
            ) : (
              <div style={{ width: '14px' }} />
            )}
          </div>
          
          {/* Main Content */}
          <div 
            className="tree-item-content"
            onClick={() => handleSelect(node)}
          >
            <div className="tree-item-icon">
              {icon}
            </div>
            <span className="tree-item-text">{node.name}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="tree-item-actions">
            {/* Debug button - only shown in debug mode */}
            {debugMode && (
              <button
                className="tree-action-btn debug-btn"
                onClick={() => {
                  console.log('Debug info for node:', node);
                  if (node.type === 'organization') {
                    checkOrganizationProjects(node.id);
                  }
                }}
                title="Debug info"
              >
                <InfoIcon size={12} />
              </button>
            )}
            
            {node.type !== 'page' && (
              <button
                className="tree-action-btn add-btn"
                onClick={() => handleAdd(node)}
                title={`Add to ${node.type}`}
              >
                <PlusIcon size={12} />
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="tree-children">
            {node.children!.map(child => 
              renderTreeNode(
                child, 
                node.id,
                parentId,
                grandParentId
              )
            )}
          </div>
        )}
      </div>
    )
  }

  // Modified render function with debug controls
  return (
    <div className="text-matrix-green text-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-matrix-amber text-xs uppercase tracking-wider">Library</h3>
        <div className="flex gap-2">
          {/* Toggle debug mode */}
          <button
            className={`p-1 rounded ${debugMode ? 'bg-matrix-amber bg-opacity-20' : 'hover:bg-matrix-amber hover:bg-opacity-10'}`}
            onClick={() => setDebugMode(!debugMode)}
            title="Toggle Debug Mode"
          >
            <InfoIcon size={14} className={debugMode ? 'text-matrix-amber' : 'text-matrix-amber text-opacity-50'} />
          </button>
          
          {/* Force refresh button */}
          <button
            className="p-1 hover:bg-matrix-green hover:bg-opacity-20 rounded"
            onClick={refreshDatabase}
            title="Force Refresh Database"
          >
            <RefreshCwIcon size={14} />
          </button>
          
          {/* Force reload organizations */}
          <button
            className="p-1 hover:bg-matrix-red hover:bg-opacity-20 rounded"
            onClick={() => {
              console.log('Force reloading organizations');
              // Clear expanded states to prevent auto-loading
              setExpandedNodes({});
              loadOrganizations();
            }}
            title="Force Reload Organizations"
          >
            <ChevronRightIcon size={14} className="rotate-90" />
          </button>
          
          <button 
            className="p-1 hover:bg-matrix-green hover:bg-opacity-20 rounded"
            onClick={onAddOrganization}
          >
            <PlusIcon size={14} />
          </button>
        </div>
      </div>
      
      <div>
        {organizations.length > 0 ? (
          organizations.map(org => renderTreeNode(org))
        ) : (
          <div className="text-matrix-green opacity-50 text-xs">
            No organizations found
          </div>
        )}
      </div>
      
      {/* Debug display of node structure */}
      {debugMode && (
        <div className="mt-4 pt-4 border-t border-matrix-gold/20 text-xs text-matrix-amber/50">
          <details>
            <summary className="cursor-pointer">Debug: Expanded Nodes</summary>
            <pre className="mt-2 p-2 bg-black/30 rounded text-xs overflow-auto">
              {JSON.stringify(Object.keys(expandedNodes).filter(id => expandedNodes[id]), null, 2)}
            </pre>
          </details>
          
          <details className="mt-2">
            <summary className="cursor-pointer">Debug: Organizations Structure</summary>
            <pre className="mt-2 p-2 bg-black/30 rounded text-xs overflow-auto max-h-[300px]">
              {JSON.stringify(organizations, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

export default NavigationTree 
