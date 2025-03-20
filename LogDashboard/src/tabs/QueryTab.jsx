import React, { useEffect, useState } from 'react'
import { MdOutlineSearch, MdRefresh, MdCancel } from "react-icons/md";
import { IoMdArrowDropup, IoMdArrowDropdown, IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";

const QueryTab = ({ logs }) => {

    const timeIntervals = ["1 min", "2 mins", "5 mins", "10 mins", "30 mins", "1 hour", "2 hours", "6 hours", "12 hours", "1 day"]
    const pageSize = [10, 20, 50, 100]

    const [selectedLog, setSelectedLog] = useState(null)
    const [isQueryActive, setIsQueryActive] = useState(false)
    const [queriedLogs, setQueriedLogs] = useState([])
    const [formData, setFormData] = useState({
        "query": "",
        "time_interval": timeIntervals[3],
        "page_number": 0,
        "page_size": pageSize[1]
    })

    function changePageNumber(direction) {
        if (direction > 0) {
            setFormData({ ...formData, "page_number": Math.min(formData["page_number"] + 1, 10) })
        } else {
            setFormData({ ...formData, "page_number": Math.max(formData["page_number"] - 1, 0) })
        }
    }

    async function fetchLogs() {
        if (formData["query"] != "") {
            setIsQueryActive(true)

            await fetch(`http://localhost:9001/api/v1/logs?query=${formData["query"]}&skip=${formData["page_number"]}&limit=${formData["page_size"]}`)
                .then(res => res.json())
                .then(data => {
                    setQueriedLogs(data)
                }).catch(error => {
                    console.log(error)
                })
        }

    }

    function clearForm() {
        setFormData({
            query: "",
            time_interval: timeIntervals[3],
            page_number: 0,
            page_size: pageSize[1]
        })
        setIsQueryActive(false)
    }

    useEffect(() => {
        console.log("queried logs", queriedLogs)
    }, [queriedLogs])

    return (
        <div>
            <div className='my-2 flex justify-center'>
                <div className='mx-2 flex rounded-full shadow-md'>
                    <input
                        value={formData["query"]}
                        onChange={(e) => {
                            setFormData({ ...formData, "query": e.target.value })
                        }}
                        className="px-5 rounded-l-full"
                        placeholder='Search Logs...'></input>
                    <button className='bg-white rounded-r-full px-3'>
                        <MdOutlineSearch
                            className="w-4 h-4"
                            onClick={() => { fetchLogs() }}
                        />
                    </button>
                </div>
                <div className='mx-2'>
                    <select
                        className="p-2 rounded-full shadow-md"
                        // defaultValue={timeIntervals[3]}
                        value={formData["time_interval"]}
                        onChange={(e) => {
                            setFormData({ ...formData, "time_interval": e.target.value })
                        }}>
                        {
                            timeIntervals.map((interval, index) => {
                                return <option key={index} value={interval}>{interval}</option>
                            })
                        }
                    </select>
                </div>
                {
                    isQueryActive === true ? <>
                        <div className='mx-2'>
                            <button
                                className='flex p-2 bg-white rounded-full shadow-md'>
                                Refresh
                                <MdRefresh
                                    className='mx-1 align-middle w-4 h-4 text-blue-500 fill-current' />
                            </button>
                        </div>
                        <div className='mx-2'>
                            <button
                                className='flex p-2 bg-white rounded-full shadow-md'
                                onClick={() => { clearForm() }}
                            >
                                Clear
                                <MdCancel
                                    className='mx-1 align-middle w-4 h-4 text-blue-500 fill-current' />
                            </button>
                        </div>
                    </> : <></>
                }
            </div>
            {
                isQueryActive === true ? <>
                    <br />
                    <div className='m-2 flex'>
                        <div className='flex bg-white mx-2 shadow-md'>
                            <button
                                className=''
                                onClick={() => { changePageNumber(-1) }}>
                                <IoMdArrowDropleft />
                            </button>
                            <p className='px-2'>{`Showing Page ${formData["page_number"]} of n`}</p>
                            <button
                                className=''
                                onClick={() => { changePageNumber(1) }}>
                                <IoMdArrowDropright />
                            </button>
                        </div>
                        <div className='mx-2 shadow-md bg-white'>
                            <label className='px-2'>Page Size: </label>
                            <select
                                className="px-2"
                                // defaultValue={pageSize[1]}
                                value={formData["page_size"]}
                                onChange={(e) => {
                                    setFormData({ ...formData, "page_size": e.target.value })
                                }}>

                                {
                                    pageSize.map((interval, index) => {
                                        return <option key={index} value={interval}>{interval}</option>
                                    })
                                }
                            </select>
                        </div>
                    </div>
                </> : <></>
            }
            <div>
                {/* List the logs here */}
                <div className='p-5 max-h-[500px] overflow-y-auto'>
                    {
                        isQueryActive === false ?
                            logs.length > 0 ? logs.map((log, index) => {
                                return <div
                                    className={`flex flex-row h-md bg-white my-1 py-2 ${selectedLog !== index ? "max-h-[40px]" : ""}`}
                                    key={index}
                                    onClick={() => {
                                        selectedLog !== null && selectedLog === index ? setSelectedLog(null) :
                                            setSelectedLog(index)
                                    }}>
                                    <div className='px-2'>
                                        {
                                            selectedLog === index ? <button>
                                                <IoMdArrowDropup />
                                            </button> : <button>
                                                <IoMdArrowDropdown />
                                            </button>
                                        }
                                    </div>
                                    <div className={`basis-1/5 ${selectedLog == index ? "font-bold" : ""}`}>
                                        {new Date(log.processed_at).toLocaleString()}
                                    </div>
                                    <div
                                        className='basis-4/5 text-left overflow-hidden text-eplipses'>
                                        {
                                            selectedLog === index ? <pre
                                                className="bg-sky-50 m-2 p-2 font-bold">
                                                {JSON.stringify(log, undefined, 2)}
                                            </pre> : <p>
                                                {JSON.stringify(log)}
                                            </p>
                                        }
                                    </div>
                                </div>
                            }) : <div className='bg-white p-2'>
                                <p>No Logs to show yet...</p>
                            </div>
                            : queriedLogs.length > 0 ? queriedLogs.map((log, index) => {
                                return <div
                                    className={`flex flex-row h-md bg-white my-1 py-2 ${selectedLog !== index ? "max-h-[40px]" : ""}`}
                                    key={index}
                                    onClick={() => {
                                        selectedLog !== null && selectedLog === index ? setSelectedLog(null) :
                                            setSelectedLog(index)
                                    }}>
                                    <div className='px-2'>
                                        {
                                            selectedLog === index ? <button>
                                                <IoMdArrowDropup />
                                            </button> : <button>
                                                <IoMdArrowDropdown />
                                            </button>
                                        }
                                    </div>
                                    <div className={`basis-1/5 ${selectedLog == index ? "font-bold" : ""}`}>
                                        {new Date(log.processed_at).toLocaleString()}
                                    </div>
                                    <div
                                        className='basis-4/5 text-left overflow-hidden text-eplipses'>
                                        {
                                            selectedLog === index ? <pre
                                                className="bg-sky-50 m-2 p-2 font-bold">
                                                {JSON.stringify(log, undefined, 2)}
                                            </pre> : <p>
                                                {JSON.stringify(log)}
                                            </p>
                                        }
                                    </div>
                                </div>
                            }) : <div className='bg-white p-2'>
                                <p>No Logs to show yet...</p>
                            </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default QueryTab