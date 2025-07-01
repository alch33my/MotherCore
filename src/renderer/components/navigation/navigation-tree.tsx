import React, { useState, useEffect } from 'react'
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, BookIcon, FileIcon, FileTextIcon, PlusIcon } from 'lucide-react'

interface NavigationTreeProps {
  onSelectOrganization: (orgId: string) => void
  onSelectProject: (projectId: string) => void
  onSelectBook: (bookId: string) => void
  onSelectChapter: (chapterId: string) => void
  onSelectPage: (pageId: string) => void
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
  
  // Load organizations on component mount
  useEffect(() => {
    loadOrganizations()
  }, [])
  
  async function loadOrganizations() {
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      const result = await window.electronAPI.getOrganizations()
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
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      setLoading(prev => ({ ...prev, [orgId]: true }))
      const result = await window.electronAPI.getProjects(orgId)
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
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      setLoading(prev => ({ ...prev, [projectId]: true }))
      const result = await window.electronAPI.getBooks(projectId)
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
      console.error(`Failed to load books for project ${projectId}:`, err)
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(prev => ({ ...prev, [projectId]: false }))
    }
  }

  async function loadChapters(bookId: string, projectId: string, orgId: string) {
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      setLoading(prev => ({ ...prev, [bookId]: true }))
      const result = await window.electronAPI.getChapters(bookId)
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
      console.error(`Failed to load chapters for book ${bookId}:`, err)
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(prev => ({ ...prev, [bookId]: false }))
    }
  }

  async function loadPages(chapterId: string, bookId: string, projectId: string, orgId: string) {
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available')
        return
      }
      
      setLoading(prev => ({ ...prev, [chapterId]: true }))
      const result = await window.electronAPI.getPages(chapterId)
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
      console.error(`Failed to load pages for chapter ${chapterId}:`, err)
      window.electronAPI?.logError(String(err))
    } finally {
      setLoading(prev => ({ ...prev, [chapterId]: false }))
    }
  }

  function toggleExpand(node: TreeNode, parentId?: string, grandParentId?: string, greatGrandParentId?: string) {
    const nodeId = node.id
    const isExpanded = expandedNodes[nodeId] || false
    
    // Toggle the expanded state
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !isExpanded
    }))
    
    // Load children if expanding and there are no children loaded yet
    if (!isExpanded) {
      if (node.type === 'organization' && (!node.children || node.children.length === 0)) {
        loadProjects(nodeId)
      } else if (node.type === 'project' && (!node.children || node.children.length === 0) && parentId) {
        loadBooks(nodeId, parentId)
      } else if (node.type === 'book' && (!node.children || node.children.length === 0) && parentId && grandParentId) {
        loadChapters(nodeId, parentId, grandParentId)
      } else if (node.type === 'chapter' && (!node.children || node.children.length === 0) && parentId && grandParentId && greatGrandParentId) {
        loadPages(nodeId, parentId, grandParentId, greatGrandParentId)
      }
    }
  }

  function handleSelect(node: TreeNode) {
    switch (node.type) {
      case 'organization':
        onSelectOrganization(node.id)
        break
      case 'project':
        onSelectProject(node.id)
        break
      case 'book':
        onSelectBook(node.id)
        break
      case 'chapter':
        onSelectChapter(node.id)
        break
      case 'page':
        onSelectPage(node.id)
        break
    }
  }

  function handleAdd(node: TreeNode) {
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
        return <BookIcon size={16} style={{ color: color || '#ffd700' }} />
      case 'chapter':
        return <FileIcon size={16} className="text-matrix-gold" />
      case 'page':
        return <FileTextIcon size={16} className="text-white" />
      default:
        return <FileIcon size={16} className="text-matrix-gold" />
    }
  }

  function renderTreeNode(node: TreeNode, depth: number = 0, parentId?: string, grandParentId?: string, greatGrandParentId?: string) {
    const isExpanded = expandedNodes[node.id] || false
    const isLoading = loading[node.id] || false
    const hasChildren = (node.children && node.children.length > 0) || 
      (node.type !== 'page' && !isLoading); // Pages don't have children
    
    // Calculate padding based on depth
    const paddingLeft = `${depth * 16 + 4}px`
    
    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center justify-between py-1 px-2 hover:bg-matrix-gold hover:bg-opacity-10 rounded cursor-pointer`}
          style={{ paddingLeft }}
        >
          <div className="flex items-center flex-1" onClick={() => toggleExpand(node, parentId, grandParentId, greatGrandParentId)}>
            <span className="w-4 h-4 flex items-center justify-center mr-1">
              {node.type !== 'page' && (
                isLoading ? (
                  <div className="w-3 h-3 border-2 border-matrix-amber border-t-transparent rounded-full animate-spin" />
                ) : hasChildren ? (
                  isExpanded ? 
                    <ChevronDownIcon size={14} className="text-matrix-amber" /> : 
                    <ChevronRightIcon size={14} className="text-matrix-amber" />
                ) : null
              )}
            </span>
            
            <span className="mr-2">{getIcon(node.type, node.color)}</span>
            
            <span 
              className="text-white truncate flex-1"
              onClick={(e) => {
                e.stopPropagation()
                handleSelect(node)
              }}
            >
              {node.name}
            </span>
          </div>
          
          {node.type !== 'page' && (
            <button
              className="w-6 h-6 flex items-center justify-center text-matrix-amber hover:text-matrix-gold rounded-full hover:bg-matrix-black hover:bg-opacity-30"
              onClick={(e) => {
                e.stopPropagation()
                handleAdd(node)
              }}
              title={`Add to ${node.name}`}
            >
              <PlusIcon size={14} />
            </button>
          )}
        </div>
        
        {isExpanded && (
          <div>
            {isLoading && !node.children?.length && (
              <div className="pl-8 py-1 text-matrix-amber text-sm">
                Loading...
              </div>
            )}
            
            {hasChildren && node.children?.map(childNode => 
              renderTreeNode(
                childNode, 
                depth + 1, 
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
  
  return (
    <div className="text-matrix-green text-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-matrix-amber text-xs uppercase tracking-wider">Library</h3>
        <button 
          className="p-1 hover:bg-matrix-green hover:bg-opacity-20 rounded"
          onClick={onAddOrganization}
        >
          <PlusIcon size={14} />
        </button>
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
    </div>
  )
}

export default NavigationTree 